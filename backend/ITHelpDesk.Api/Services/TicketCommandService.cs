using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class TicketCommandService : ITicketCommandService
{
    private readonly ApplicationDbContext _dbContext;

    public TicketCommandService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<TicketCommandResult> CreateAsync(
        int userId,
        CreateTicketRequest request,
        CancellationToken cancellationToken = default)
    {
        var categoryExists = await _dbContext.Categories
            .AnyAsync(
                category =>
                    category.Id == request.CategoryId &&
                    category.IsActive,
                cancellationToken);

        if (!categoryExists)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.CategoryNotFound);
        }

        var priorityExists = await _dbContext.Priorities
            .AnyAsync(
                priority =>
                    priority.Id == request.PriorityId &&
                    priority.IsActive,
                cancellationToken);

        if (!priorityExists)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.PriorityNotFound);
        }

        var now = DateTime.UtcNow;

        var ticket = new Ticket
        {
            ReferenceNumber = GenerateReferenceNumber(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            CategoryId = request.CategoryId,
            PriorityId = request.PriorityId,
            StatusId = TicketStatusIds.Open,
            CreatedByUserId = userId,
            AssignedToUserId = null,
            CreatedDate = now,
            LastUpdatedDate = now,
            IsDeleted = false
        };

        _dbContext.Tickets.Add(ticket);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = await GetTicketResponseAsync(
            ticket.Id,
            cancellationToken);

        return TicketCommandResult.Success(response);
    }

    public async Task<TicketCommandResult> UpdateAsync(
        int ticketId,
        int userId,
        bool isAdmin,
        UpdateTicketRequest request,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.TicketNotFound);
        }

        if (!isAdmin && ticket.CreatedByUserId != userId)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.Forbidden);
        }

        var categoryExists = await _dbContext.Categories
            .AnyAsync(
                category =>
                    category.Id == request.CategoryId &&
                    category.IsActive,
                cancellationToken);

        if (!categoryExists)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.CategoryNotFound);
        }

        var priorityExists = await _dbContext.Priorities
            .AnyAsync(
                priority =>
                    priority.Id == request.PriorityId &&
                    priority.IsActive,
                cancellationToken);

        if (!priorityExists)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.PriorityNotFound);
        }

        ticket.Title = request.Title.Trim();
        ticket.Description = request.Description.Trim();
        ticket.CategoryId = request.CategoryId;
        ticket.PriorityId = request.PriorityId;
        ticket.LastUpdatedDate = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = await GetTicketResponseAsync(
            ticket.Id,
            cancellationToken);

        return TicketCommandResult.Success(response);
    }

    public async Task<TicketCommandResult> DeleteAsync(
        int ticketId,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.TicketNotFound);
        }

        if (!isAdmin && ticket.CreatedByUserId != userId)
        {
            return TicketCommandResult.Failure(
                TicketCommandError.Forbidden);
        }

        var now = DateTime.UtcNow;
        var previousWorkMinutes =
            ticket.AccumulatedWorkMinutes;

        // Stop active working time before deleting the ticket.
        if (ticket.StatusId == TicketStatusIds.InProgress &&
            ticket.WorkStartedAtUtc.HasValue)
        {
            var sessionMinutes = Math.Max(
                1,
                (int)Math.Ceiling(
                    (now - ticket.WorkStartedAtUtc.Value)
                    .TotalMinutes));

            ticket.AccumulatedWorkMinutes +=
                sessionMinutes;

            ticket.WorkStartedAtUtc = null;

            _dbContext.TicketHistory.Add(
                new TicketHistory
                {
                    TicketId = ticket.Id,
                    ChangedByUserAccountId = userId,
                    FieldName = "AccumulatedWorkMinutes",
                    OldValue = previousWorkMinutes.ToString(),
                    NewValue =
                        ticket.AccumulatedWorkMinutes.ToString(),
                    ChangedDate = now
                });
        }

        // Soft delete preserves audit and reporting data.
        ticket.IsDeleted = true;
        ticket.DeletedDate = now;
        ticket.DeletedByUserId = userId;
        ticket.LastUpdatedDate = now;

        _dbContext.TicketHistory.Add(
            new TicketHistory
            {
                TicketId = ticket.Id,
                ChangedByUserAccountId = userId,
                FieldName = "IsDeleted",
                OldValue = "False",
                NewValue = "True",
                ChangedDate = now
            });

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = userId,
                TicketId = ticket.Id,
                ActivityType = "TicketDeleted",
                Description =
                    $"Ticket {ticket.ReferenceNumber} was deleted.",
                EntityType = nameof(Ticket),
                EntityId = ticket.Id,
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return TicketCommandResult.Success();
    }

    private async Task<TicketResponse?> GetTicketResponseAsync(
        int ticketId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == ticketId)
            .Select(ticket => new TicketResponse
            {
                Id = ticket.Id,
                ReferenceNumber = ticket.ReferenceNumber,
                Title = ticket.Title,
                Description = ticket.Description,

                CategoryId = ticket.CategoryId,
                CategoryName = ticket.Category.CategoryName,

                PriorityId = ticket.PriorityId,
                PriorityName = ticket.Priority.PriorityName,
                PriorityColorCode = ticket.Priority.ColorCode,

                StatusId = ticket.StatusId,
                StatusName = ticket.Status.StatusName,

                CreatedByUserId = ticket.CreatedByUserId,
                CreatedByName =
                    ticket.CreatedByUser.FirstName + " " +
                    ticket.CreatedByUser.LastName,

                AssignedToUserId = ticket.AssignedToUserId,
                AssignedToName = ticket.AssignedToUser == null
                    ? null
                    : ticket.AssignedToUser.FirstName + " " +
                      ticket.AssignedToUser.LastName,

                CreatedDate = ticket.CreatedDate,
                LastUpdatedDate = ticket.LastUpdatedDate,
                DueDate = ticket.DueDate,
                ResolvedDate = ticket.ResolvedDate,
                ClosedDate = ticket.ClosedDate,
                CancelledDate = ticket.CancelledDate,
                WorkStartedAtUtc = ticket.WorkStartedAtUtc,
                AccumulatedWorkMinutes =
                    ticket.AccumulatedWorkMinutes,
                AccumulatedWorkHours = Math.Round(
                    ticket.AccumulatedWorkMinutes / 60.0,
                    2)
            })
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static string GenerateReferenceNumber()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");

        var randomPart = Guid.NewGuid()
            .ToString("N")[..8]
            .ToUpperInvariant();

        return $"TKT-{datePart}-{randomPart}";
    }
}