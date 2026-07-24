using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Lookups;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class TicketQueryService : ITicketQueryService
{
    private readonly ApplicationDbContext _dbContext;

    public TicketQueryService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TicketResponse>> GetTicketsAsync(
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Tickets
            .AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(
                ticket => ticket.CreatedByUserId == userId);
        }

        return await ProjectToResponse(query)
            .OrderByDescending(ticket => ticket.CreatedDate)
            .ThenByDescending(ticket => ticket.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<TicketResponse?> GetTicketByIdAsync(
        int ticketId,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == ticketId);

        if (!isAdmin)
        {
            query = query.Where(
                ticket => ticket.CreatedByUserId == userId);
        }

        return await ProjectToResponse(query)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetCategoriesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.CategoryName)
            .Select(category => new CategoryResponse
            {
                Id = category.Id,
                CategoryName = category.CategoryName,
                Description = category.Description
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PriorityResponse>> GetPrioritiesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Priorities
            .AsNoTracking()
            .Where(priority => priority.IsActive)
            .OrderBy(priority => priority.PriorityRank)
            .ThenBy(priority => priority.PriorityName)
            .Select(priority => new PriorityResponse
            {
                Id = priority.Id,
                PriorityName = priority.PriorityName,
                PriorityRank = priority.PriorityRank,
                ColorCode = priority.ColorCode
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StatusResponse>> GetStatusesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Statuses
            .AsNoTracking()
            .Where(status => status.IsActive)
            .OrderBy(status => status.SortOrder)
            .ThenBy(status => status.StatusName)
            .Select(status => new StatusResponse
            {
                Id = status.Id,
                StatusName = status.StatusName,
                SortOrder = status.SortOrder,
                IsFinal = status.IsFinal
            })
            .ToListAsync(cancellationToken);
    }

    private static IQueryable<TicketResponse> ProjectToResponse(
        IQueryable<Ticket> query)
    {
        return query.Select(ticket => new TicketResponse
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
            ClosedDate = ticket.ClosedDate
        });
    }
}