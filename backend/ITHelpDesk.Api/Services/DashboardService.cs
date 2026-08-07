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
}
