using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _dbContext;

    public DashboardService(
        ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardSummaryResponse>
        GetSummaryAsync(
            int userId,
            bool isAdmin,
            CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Tickets
            .AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(
                ticket =>
                    ticket.CreatedByUserId == userId);
        }

        var totalTickets =
            await query.CountAsync(
                cancellationToken);

        var openTickets =
            await query.CountAsync(
                ticket =>
                    ticket.Status.StatusName == "Open",
                cancellationToken);

        var inProgressTickets =
            await query.CountAsync(
                ticket =>
                    ticket.Status.StatusName ==
                    "In Progress",
                cancellationToken);

        var pendingTickets =
            await query.CountAsync(
                ticket =>
                    ticket.Status.StatusName ==
                    "Pending",
                cancellationToken);

        var resolvedTickets =
            await query.CountAsync(
                ticket =>
                    ticket.Status.StatusName ==
                    "Resolved" ||
                    ticket.Status.StatusName ==
                    "Closed",
                cancellationToken);

        return new DashboardSummaryResponse
        {
            TotalTickets = totalTickets,
            OpenTickets = openTickets,
            InProgressTickets =
                inProgressTickets,
            PendingTickets =
                pendingTickets,
            ResolvedTickets =
                resolvedTickets
        };
    }

    public async Task<DashboardChartsResponse>
        GetChartsAsync(
            int userId,
            bool isAdmin,
            CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Tickets
            .AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(
                ticket =>
                    ticket.CreatedByUserId == userId);
        }

        var ticketsByStatus =
            await query
                .GroupBy(ticket => new
                {
                    ticket.Status.StatusName,
                    ticket.Status.SortOrder
                })
                .Select(group => new
                {
                    Name =
                        group.Key.StatusName,
                    SortOrder =
                        group.Key.SortOrder,
                    Count =
                        group.Count()
                })
                .OrderBy(item => item.SortOrder)
                .Select(item =>
                    new DashboardChartItemResponse
                    {
                        Name = item.Name,
                        Count = item.Count
                    })
                .ToListAsync(
                    cancellationToken);

        var ticketsByPriority =
            await query
                .GroupBy(ticket => new
                {
                    ticket.Priority.PriorityName,
                    ticket.Priority.PriorityRank
                })
                .Select(group => new
                {
                    Name =
                        group.Key.PriorityName,
                    Rank =
                        group.Key.PriorityRank,
                    Count =
                        group.Count()
                })
                .OrderBy(item => item.Rank)
                .Select(item =>
                    new DashboardChartItemResponse
                    {
                        Name = item.Name,
                        Count = item.Count
                    })
                .ToListAsync(
                    cancellationToken);

        var ticketsByCategory =
            await query
                .GroupBy(ticket =>
                    ticket.Category.CategoryName)
                .Select(group =>
                    new DashboardChartItemResponse
                    {
                        Name = group.Key,
                        Count = group.Count()
                    })
                .OrderByDescending(
                    item => item.Count)
                .ThenBy(item => item.Name)
                .ToListAsync(
                    cancellationToken);

        return new DashboardChartsResponse
        {
            TicketsByStatus = ticketsByStatus,
            TicketsByPriority = ticketsByPriority,
            TicketsByCategory = ticketsByCategory
        };
    }
}