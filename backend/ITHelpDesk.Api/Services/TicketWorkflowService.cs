using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class TicketWorkflowService
    : ITicketWorkflowService
{
    private readonly ApplicationDbContext _dbContext;

    public TicketWorkflowService(
        ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<
        TicketWorkflowResult<TicketStatusUpdateResponse>>
        UpdateStatusAsync(
            int ticketId,
            int userId,
            bool isAdmin,
            bool isManager,
            bool isAgent,
            UpdateTicketStatusRequest request,
            CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.Tickets
            .Include(ticket => ticket.Status)
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketWorkflowResult<
                TicketStatusUpdateResponse>.Failure(
                    TicketWorkflowError.TicketNotFound);
        }

        if (!CanChangeStatus(
                ticket,
                userId,
                isAdmin,
                isManager,
                isAgent,
                request.NewStatusId))
        {
            return TicketWorkflowResult<
                TicketStatusUpdateResponse>.Failure(
                    TicketWorkflowError.Forbidden);
        }

        if (ticket.StatusId == request.NewStatusId)
        {
            return TicketWorkflowResult<
                TicketStatusUpdateResponse>.Failure(
                    TicketWorkflowError.SameStatus);
        }

        var newStatus = await _dbContext.Statuses
            .AsNoTracking()
            .SingleOrDefaultAsync(
                status =>
                    status.Id == request.NewStatusId &&
                    status.IsActive,
                cancellationToken);

        if (newStatus is null)
        {
            return TicketWorkflowResult<
                TicketStatusUpdateResponse>.Failure(
                    TicketWorkflowError.StatusNotFound);
        }

        if (!IsValidTransition(
                ticket.StatusId,
                request.NewStatusId))
        {
            return TicketWorkflowResult<
                TicketStatusUpdateResponse>.Failure(
                    TicketWorkflowError.InvalidStatusTransition);
        }

        var reason = request.Reason?.Trim();

        if (request.NewStatusId == TicketStatusIds.Cancelled &&
            string.IsNullOrWhiteSpace(reason))
        {
            return TicketWorkflowResult<
                TicketStatusUpdateResponse>.Failure(
                    TicketWorkflowError
                        .CancellationReasonRequired);
        }

        var now = DateTime.UtcNow;
        var previousStatusId = ticket.StatusId;
        var previousStatusName = ticket.Status.StatusName;
        var previousWorkMinutes =
            ticket.AccumulatedWorkMinutes;

        var workMinutesAdded = StopWorkTimer(
            ticket,
            now);

        if (request.NewStatusId ==
            TicketStatusIds.InProgress)
        {
            ticket.WorkStartedAtUtc = now;
        }

        ApplyStatusDates(
            ticket,
            previousStatusId,
            request.NewStatusId,
            now);

        ticket.StatusId = request.NewStatusId;
        ticket.LastUpdatedDate = now;

        _dbContext.TicketHistory.Add(
            new TicketHistory
            {
                TicketId = ticket.Id,
                ChangedByUserAccountId = userId,
                FieldName = "Status",
                OldValue = previousStatusName,
                NewValue = newStatus.StatusName,
                ChangedDate = now
            });

        if (workMinutesAdded > 0)
        {
            _dbContext.TicketHistory.Add(
                new TicketHistory
                {
                    TicketId = ticket.Id,
                    ChangedByUserAccountId = userId,
                    FieldName =
                        "AccumulatedWorkMinutes",
                    OldValue =
                        previousWorkMinutes.ToString(),
                    NewValue =
                        ticket.AccumulatedWorkMinutes
                            .ToString(),
                    ChangedDate = now
                });
        }

        if (request.NewStatusId ==
            TicketStatusIds.Cancelled)
        {
            _dbContext.TicketHistory.Add(
                new TicketHistory
                {
                    TicketId = ticket.Id,
                    ChangedByUserAccountId = userId,
                    FieldName =
                        "CancellationReason",
                    OldValue = null,
                    NewValue = reason,
                    ChangedDate = now
                });

            _dbContext.TicketComments.Add(
                new TicketComment
                {
                    TicketId = ticket.Id,
                    UserAccountId = userId,
                    CommentText =
                        $"Cancellation reason: {reason}",
                    IsInternal = false,
                    CreatedDate = now,
                    IsDeleted = false
                });
        }

        var activityType =
            GetStatusActivityType(request.NewStatusId);

        var activityDescription =
            $"Ticket {ticket.ReferenceNumber} status changed " +
            $"from {previousStatusName} to " +
            $"{newStatus.StatusName}.";

        if (!string.IsNullOrWhiteSpace(reason))
        {
            activityDescription +=
                $" Reason: {reason}";
        }

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = userId,
                TicketId = ticket.Id,
                ActivityType = activityType,
                Description = activityDescription,
                EntityType = nameof(Ticket),
                EntityId = ticket.Id,
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var response =
            new TicketStatusUpdateResponse
            {
                TicketId = ticket.Id,
                ReferenceNumber =
                    ticket.ReferenceNumber,
                PreviousStatusId =
                    previousStatusId,
                PreviousStatusName =
                    previousStatusName,
                CurrentStatusId =
                    newStatus.Id,
                CurrentStatusName =
                    newStatus.StatusName,
                ChangedByUserId = userId,
                ChangedAtUtc = now,
                WorkStartedAtUtc =
                    ticket.WorkStartedAtUtc,
                WorkMinutesAdded =
                    workMinutesAdded,
                TotalWorkMinutes =
                    ticket.AccumulatedWorkMinutes,
                TotalWorkHours = Math.Round(
                    ticket.AccumulatedWorkMinutes /
                    60.0,
                    2),
                ResolvedDate =
                    ticket.ResolvedDate,
                ClosedDate =
                    ticket.ClosedDate,
                CancelledDate =
                    ticket.CancelledDate
            };

        return TicketWorkflowResult<
            TicketStatusUpdateResponse>.Success(response);
    }

    public async Task<
        TicketWorkflowResult<
            IReadOnlyList<TicketTimelineItemResponse>>>
        GetTimelineAsync(
            int ticketId,
            int userId,
            bool isAdmin,
            bool isManager,
            bool isAgent,
            CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == ticketId)
            .Select(ticket => new
            {
                ticket.Id,
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                ticket.CreatedDate,
                CreatedByName =
                    ticket.CreatedByUser.FirstName +
                    " " +
                    ticket.CreatedByUser.LastName
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (ticket is null)
        {
            return TicketWorkflowResult<
                IReadOnlyList<
                    TicketTimelineItemResponse>>.Failure(
                        TicketWorkflowError
                            .TicketNotFound);
        }

        if (!CanViewTicket(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                userId,
                isAdmin,
                isManager,
                isAgent))
        {
            return TicketWorkflowResult<
                IReadOnlyList<
                    TicketTimelineItemResponse>>.Failure(
                        TicketWorkflowError.Forbidden);
        }

        var history = await _dbContext.TicketHistory
            .AsNoTracking()
            .Where(item => item.TicketId == ticketId)
            .Select(item =>
                new TicketTimelineItemResponse
                {
                    Id = item.Id,
                    EventType = "FieldChanged",
                    FieldName = item.FieldName,
                    OldValue = item.OldValue,
                    NewValue = item.NewValue,
                    ChangedByUserId =
                        item.ChangedByUserAccountId,
                    ChangedByName =
                        item.ChangedByUserAccount
                            .FirstName +
                        " " +
                        item.ChangedByUserAccount
                            .LastName,
                    ChangedAtUtc =
                        item.ChangedDate
                })
            .ToListAsync(cancellationToken);

        history.Add(
            new TicketTimelineItemResponse
            {
                Id = 0,
                EventType = "Created",
                FieldName = "Status",
                OldValue = null,
                NewValue = "Open",
                ChangedByUserId =
                    ticket.CreatedByUserId,
                ChangedByName =
                    ticket.CreatedByName,
                ChangedAtUtc =
                    ticket.CreatedDate
            });

        var orderedHistory = history
            .OrderBy(item => item.ChangedAtUtc)
            .ThenBy(item => item.Id)
            .ToList();

        return TicketWorkflowResult<
            IReadOnlyList<
                TicketTimelineItemResponse>>.Success(
                    orderedHistory);
    }

    public async Task<
        TicketWorkflowResult<TicketWorkTimeResponse>>
        GetWorkTimeAsync(
            int ticketId,
            int userId,
            bool isAdmin,
            bool isManager,
            bool isAgent,
            CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == ticketId)
            .Select(ticket => new
            {
                ticket.Id,
                ticket.ReferenceNumber,
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                ticket.CreatedDate,
                ticket.WorkStartedAtUtc,
                ticket.AccumulatedWorkMinutes,
                ticket.ResolvedDate,
                ticket.ClosedDate,
                ticket.CancelledDate,
                ticket.StatusId,
                StatusName =
                    ticket.Status.StatusName
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (ticket is null)
        {
            return TicketWorkflowResult<
                TicketWorkTimeResponse>.Failure(
                    TicketWorkflowError.TicketNotFound);
        }

        if (!CanViewTicket(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                userId,
                isAdmin,
                isManager,
                isAgent))
        {
            return TicketWorkflowResult<
                TicketWorkTimeResponse>.Failure(
                    TicketWorkflowError.Forbidden);
        }

        var now = DateTime.UtcNow;

        var currentSessionMinutes =
            ticket.StatusId ==
                TicketStatusIds.InProgress &&
            ticket.WorkStartedAtUtc.HasValue
                ? CalculateElapsedMinutes(
                    ticket.WorkStartedAtUtc.Value,
                    now)
                : 0;

        var totalWorkMinutes =
            ticket.AccumulatedWorkMinutes +
            currentSessionMinutes;

        var elapsedEnd =
            ticket.ClosedDate ??
            ticket.CancelledDate ??
            ticket.ResolvedDate ??
            now;

        var elapsedMinutes =
            CalculateElapsedMinutes(
                ticket.CreatedDate,
                elapsedEnd);

        var response =
            new TicketWorkTimeResponse
            {
                TicketId = ticket.Id,
                ReferenceNumber =
                    ticket.ReferenceNumber,
                StatusName = ticket.StatusName,
                IsCurrentlyWorking =
                    ticket.StatusId ==
                    TicketStatusIds.InProgress,
                CreatedDate = ticket.CreatedDate,
                WorkStartedAtUtc =
                    ticket.WorkStartedAtUtc,
                AccumulatedWorkMinutes =
                    ticket.AccumulatedWorkMinutes,
                CurrentSessionMinutes =
                    currentSessionMinutes,
                TotalWorkMinutes =
                    totalWorkMinutes,
                TotalWorkHours = Math.Round(
                    totalWorkMinutes / 60.0,
                    2),
                ElapsedMinutes =
                    elapsedMinutes,
                ElapsedHours = Math.Round(
                    elapsedMinutes / 60.0,
                    2),
                ResolvedDate =
                    ticket.ResolvedDate,
                ClosedDate =
                    ticket.ClosedDate,
                CancelledDate =
                    ticket.CancelledDate
            };

        return TicketWorkflowResult<
            TicketWorkTimeResponse>.Success(response);
    }

    private static bool CanChangeStatus(
        Ticket ticket,
        int userId,
        bool isAdmin,
        bool isManager,
        bool isAgent,
        int newStatusId)
    {
        if (isAdmin || isManager)
        {
            return true;
        }

        if (isAgent &&
            ticket.AssignedToUserId == userId)
        {
            return true;
        }

        return
            ticket.CreatedByUserId == userId &&
            newStatusId == TicketStatusIds.Cancelled;
    }

    private static bool CanViewTicket(
        int createdByUserId,
        int? assignedToUserId,
        int userId,
        bool isAdmin,
        bool isManager,
        bool isAgent)
    {
        return
            isAdmin ||
            isManager ||
            createdByUserId == userId ||
            (isAgent &&
             assignedToUserId == userId);
    }

    private static bool IsValidTransition(
        int currentStatusId,
        int newStatusId)
    {
        return currentStatusId switch
        {
            TicketStatusIds.Open =>
                newStatusId is
                    TicketStatusIds.InProgress or
                    TicketStatusIds.Pending or
                    TicketStatusIds.Cancelled,

            TicketStatusIds.InProgress =>
                newStatusId is
                    TicketStatusIds.Pending or
                    TicketStatusIds.Resolved or
                    TicketStatusIds.Cancelled,

            TicketStatusIds.Pending =>
                newStatusId is
                    TicketStatusIds.InProgress or
                    TicketStatusIds.Resolved or
                    TicketStatusIds.Cancelled,

            TicketStatusIds.Resolved =>
                newStatusId is
                    TicketStatusIds.Closed or
                    TicketStatusIds.InProgress,

            TicketStatusIds.Closed => false,

            TicketStatusIds.Cancelled => false,

            _ => false
        };
    }

    private static int StopWorkTimer(
        Ticket ticket,
        DateTime now)
    {
        if (ticket.StatusId !=
                TicketStatusIds.InProgress ||
            !ticket.WorkStartedAtUtc.HasValue)
        {
            return 0;
        }

        var addedMinutes =
            CalculateElapsedMinutes(
                ticket.WorkStartedAtUtc.Value,
                now);

        ticket.AccumulatedWorkMinutes +=
            addedMinutes;

        ticket.WorkStartedAtUtc = null;

        return addedMinutes;
    }

    private static void ApplyStatusDates(
        Ticket ticket,
        int previousStatusId,
        int newStatusId,
        DateTime now)
    {
        if (previousStatusId ==
                TicketStatusIds.Resolved &&
            newStatusId ==
                TicketStatusIds.InProgress)
        {
            ticket.ResolvedDate = null;
            ticket.ClosedDate = null;
        }

        if (newStatusId ==
            TicketStatusIds.Resolved)
        {
            ticket.ResolvedDate = now;
        }

        if (newStatusId ==
            TicketStatusIds.Closed)
        {
            ticket.ClosedDate = now;
        }

        if (newStatusId ==
            TicketStatusIds.Cancelled)
        {
            ticket.CancelledDate = now;
        }
    }

    private static int CalculateElapsedMinutes(
        DateTime start,
        DateTime end)
    {
        var totalMinutes =
            (end - start).TotalMinutes;

        if (totalMinutes <= 0)
        {
            return 0;
        }

        return Math.Max(
            1,
            (int)Math.Ceiling(totalMinutes));
    }

    private static string GetStatusActivityType(
        int newStatusId)
    {
        return newStatusId switch
        {
            TicketStatusIds.InProgress =>
                "TicketWorkStarted",

            TicketStatusIds.Pending =>
                "TicketPending",

            TicketStatusIds.Resolved =>
                "TicketResolved",

            TicketStatusIds.Closed =>
                "TicketClosed",

            TicketStatusIds.Cancelled =>
                "TicketCancelled",

            _ => "TicketStatusChanged"
        };
    }
}
