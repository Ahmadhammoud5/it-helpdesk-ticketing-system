using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Entities;
using ITHelpDesk.Api.Utilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class TicketAssignmentService
    : ITicketAssignmentService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly IPresenceService _presenceService;

    public TicketAssignmentService(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        INotificationService notificationService,
        IPresenceService presenceService)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _notificationService = notificationService;
        _presenceService = presenceService;
    }

    public async Task<List<SupportAgentResponse>> GetAgentsAsync(
        CancellationToken cancellationToken)
    {
        var agents = await _userManager.GetUsersInRoleAsync(
            SystemRoles.ITSupportAgent);

        return agents
            .Where(agent => agent.IsActive)
            .OrderBy(agent => agent.FirstName)
            .ThenBy(agent => agent.LastName)
            .Select(agent => new SupportAgentResponse
            {
                UserId = agent.Id,
                FullName =
                    $"{agent.FirstName} {agent.LastName}",
                IsOnline = _presenceService.IsOnline(agent.Id),
                LastSeenUtc = UtcDateTime.Normalize(agent.LastSeenUtc)
            })
            .ToList();
    }

    public async Task<
        TicketAssignmentResult<TicketAssignmentResponse>>
        AssignAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            AssignTicketRequest request,
            CancellationToken cancellationToken)
    {
        if (!isAdmin && !isManager)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.Forbidden);
        }

        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.TicketNotFound);
        }

        if (ticket.StatusId is
            TicketStatusIds.Closed or
            TicketStatusIds.Cancelled)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.TicketIsFinal);
        }

        var agent = await _userManager.FindByIdAsync(
            request.SupportAgentId.ToString());

        if (agent is null)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.AgentNotFound);
        }

        if (!agent.IsActive)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.AgentInactive);
        }

        var isSupportAgent =
            await _userManager.IsInRoleAsync(
                agent,
                SystemRoles.ITSupportAgent);

        if (!isSupportAgent)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError
                        .UserIsNotSupportAgent);
        }

        var currentAssignment =
            await _dbContext.TicketAssignments
                .Include(assignment =>
                    assignment.AssignedToUserAccount)
                .SingleOrDefaultAsync(
                    assignment =>
                        assignment.TicketId == ticketId &&
                        assignment.UnassignedDate == null,
                    cancellationToken);

        if (currentAssignment is not null &&
            currentAssignment.AssignedToUserAccountId ==
            agent.Id)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError
                        .TicketAlreadyAssignedToAgent);
        }

        var assignedBy =
            await _userManager.FindByIdAsync(
                currentUserId.ToString());

        var now = DateTime.UtcNow;

        var previousAgentName =
            currentAssignment is null
                ? null
                : $"{currentAssignment.AssignedToUserAccount.FirstName} " +
                  $"{currentAssignment.AssignedToUserAccount.LastName}";

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(
                cancellationToken);

        if (currentAssignment is not null)
        {
            currentAssignment.UnassignedDate = now;

            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }

        var assignment = new TicketAssignment
        {
            TicketId = ticket.Id,
            AssignedToUserAccountId = agent.Id,
            AssignedByUserAccountId = currentUserId,
            IsEscalation = request.IsEscalation,
            AssignmentReason =
                request.AssignmentReason?.Trim(),
            AssignedDate = now
        };

        _dbContext.TicketAssignments.Add(assignment);

        ticket.AssignedToUserId = agent.Id;
        ticket.LastUpdatedDate = now;

        var agentName =
            $"{agent.FirstName} {agent.LastName}";

        _dbContext.TicketHistory.Add(
            new TicketHistory
            {
                TicketId = ticket.Id,
                ChangedByUserAccountId =
                    currentUserId,
                FieldName = "AssignedToUser",
                OldValue =
                    previousAgentName ?? "Unassigned",
                NewValue = agentName,
                ChangedDate = now
            });

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = currentUserId,
                TicketId = ticket.Id,
                ActivityType =
                    currentAssignment is null
                        ? "TicketAssigned"
                        : "TicketReassigned",
                Description =
                    currentAssignment is null
                        ? $"Ticket {ticket.ReferenceNumber} " +
                          $"was assigned to {agentName}."
                        : $"Ticket {ticket.ReferenceNumber} " +
                          $"was reassigned from " +
                          $"{previousAgentName} to {agentName}.",
                EntityType = nameof(TicketAssignment),
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        await _notificationService.CreateAsync(
            agent.Id,
            ticket.Id,
            currentAssignment is null
                ? "TicketAssigned"
                : "TicketReassigned",
            currentAssignment is null
                ? "Ticket assigned to you"
                : "Ticket reassigned to you",
            $"Ticket {ticket.ReferenceNumber}: {ticket.Title}",
            cancellationToken);

        if (ticket.CreatedByUserId != agent.Id)
        {
            await _notificationService.CreateAsync(
                ticket.CreatedByUserId,
                ticket.Id,
                currentAssignment is null
                    ? "TicketAssigned"
                    : "TicketReassigned",
                currentAssignment is null
                    ? "Your ticket was assigned"
                    : "Your ticket was reassigned",
                $"Ticket {ticket.ReferenceNumber}: {ticket.Title}",
                cancellationToken);
        }

        return TicketAssignmentResult<
            TicketAssignmentResponse>.Success(
                new TicketAssignmentResponse
                {
                    TicketId = ticket.Id,
                    AssignedToUserId = agent.Id,
                    AssignedToName = agentName,
                    AssignedByName =
                        assignedBy is null
                            ? $"User {currentUserId}"
                            : $"{assignedBy.FirstName} " +
                              $"{assignedBy.LastName}",
                    IsEscalation =
                        assignment.IsEscalation,
                    AssignmentReason =
                        assignment.AssignmentReason,
                    AssignedDate =
                        assignment.AssignedDate,
                    UnassignedDate = null
                });
    }

    public async Task<
        TicketAssignmentResult<TicketAssignmentResponse>>
        UnassignAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            UnassignTicketRequest request,
            CancellationToken cancellationToken)
    {
        if (!isAdmin && !isManager)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.Forbidden);
        }

        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.TicketNotFound);
        }

        if (ticket.StatusId is
            TicketStatusIds.Closed or
            TicketStatusIds.Cancelled)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError.TicketIsFinal);
        }

        var assignment =
            await _dbContext.TicketAssignments
                .Include(item =>
                    item.AssignedToUserAccount)
                .Include(item =>
                    item.AssignedByUserAccount)
                .SingleOrDefaultAsync(
                    item =>
                        item.TicketId == ticketId &&
                        item.UnassignedDate == null,
                    cancellationToken);

        if (assignment is null)
        {
            return TicketAssignmentResult<
                TicketAssignmentResponse>.Failure(
                    TicketAssignmentError
                        .TicketNotAssigned);
        }

        var now = DateTime.UtcNow;

        assignment.UnassignedDate = now;

        ticket.AssignedToUserId = null;
        ticket.LastUpdatedDate = now;

        var agentName =
            $"{assignment.AssignedToUserAccount.FirstName} " +
            $"{assignment.AssignedToUserAccount.LastName}";

        _dbContext.TicketHistory.Add(
            new TicketHistory
            {
                TicketId = ticket.Id,
                ChangedByUserAccountId =
                    currentUserId,
                FieldName = "AssignedToUser",
                OldValue = agentName,
                NewValue = "Unassigned",
                ChangedDate = now
            });

        var reason = request.AssignmentReason?.Trim();

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = currentUserId,
                TicketId = ticket.Id,
                ActivityType = "TicketUnassigned",
                Description =
                    string.IsNullOrWhiteSpace(reason)
                        ? $"Ticket {ticket.ReferenceNumber} " +
                          $"was unassigned from {agentName}."
                        : $"Ticket {ticket.ReferenceNumber} " +
                          $"was unassigned from {agentName}. " +
                          $"Reason: {reason}",
                EntityType = nameof(TicketAssignment),
                EntityId = assignment.Id,
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        await _notificationService.CreateAsync(
            assignment.AssignedToUserAccountId,
            ticket.Id,
            "TicketUnassigned",
            "Ticket unassigned",
            $"Ticket {ticket.ReferenceNumber} is no longer assigned to you.",
            cancellationToken);

        return TicketAssignmentResult<
            TicketAssignmentResponse>.Success(
                new TicketAssignmentResponse
                {
                    TicketId = ticket.Id,
                    AssignedToUserId =
                        assignment
                            .AssignedToUserAccountId,
                    AssignedToName = agentName,
                    AssignedByName =
                        $"{assignment.AssignedByUserAccount.FirstName} " +
                        $"{assignment.AssignedByUserAccount.LastName}",
                    IsEscalation =
                        assignment.IsEscalation,
                    AssignmentReason =
                        assignment.AssignmentReason,
                    AssignedDate =
                        assignment.AssignedDate,
                    UnassignedDate = now
                });
    }

    public async Task<
        TicketAssignmentResult<
            List<TicketAssignmentResponse>>>
        GetHistoryAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CancellationToken cancellationToken)
    {
        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketAssignmentResult<
                List<TicketAssignmentResponse>>
                .Failure(
                    TicketAssignmentError
                        .TicketNotFound);
        }

        var canView = TicketAccessPolicy.CanView(
            ticket.CreatedByUserId,
            ticket.AssignedToUserId,
            currentUserId,
            isAdmin,
            isManager,
            isSupportAgent);

        if (!canView)
        {
            return TicketAssignmentResult<
                List<TicketAssignmentResponse>>
                .Failure(
                    TicketAssignmentError.Forbidden);
        }

        var history =
            await _dbContext.TicketAssignments
                .AsNoTracking()
                .Where(assignment =>
                    assignment.TicketId == ticketId)
                .OrderByDescending(assignment =>
                    assignment.AssignedDate)
                .Select(assignment =>
                    new TicketAssignmentResponse
                    {
                        TicketId =
                            assignment.TicketId,
                        AssignedToUserId =
                            assignment
                                .AssignedToUserAccountId,
                        AssignedToName =
                            assignment
                                .AssignedToUserAccount
                                .FirstName +
                            " " +
                            assignment
                                .AssignedToUserAccount
                                .LastName,
                        AssignedByName =
                            assignment
                                .AssignedByUserAccount
                                .FirstName +
                            " " +
                            assignment
                                .AssignedByUserAccount
                                .LastName,
                        IsEscalation =
                            assignment.IsEscalation,
                        AssignmentReason =
                            assignment.AssignmentReason,
                        AssignedDate =
                            assignment.AssignedDate,
                        UnassignedDate =
                            assignment.UnassignedDate
                    })
                .ToListAsync(cancellationToken);

        return TicketAssignmentResult<
            List<TicketAssignmentResponse>>
            .Success(history);
    }
}
