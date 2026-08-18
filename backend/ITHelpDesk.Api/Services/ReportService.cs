using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Reports;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class ReportService : IReportService
{
    private readonly ApplicationDbContext _dbContext;

    public ReportService(
        ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ReportSummaryResponse> GetSummaryAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        var fromUtc = from.ToDateTime(
            TimeOnly.MinValue,
            DateTimeKind.Utc);

        var toExclusiveUtc = to.AddDays(1).ToDateTime(
            TimeOnly.MinValue,
            DateTimeKind.Utc);

        var query = _dbContext.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.CreatedDate >= fromUtc &&
                ticket.CreatedDate < toExclusiveUtc);

        var totals = await query
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Total = group.Count(),
                Open = group.Count(ticket =>
                    ticket.StatusId == TicketStatusIds.Open),
                InProgress = group.Count(ticket =>
                    ticket.StatusId ==
                    TicketStatusIds.InProgress),
                Pending = group.Count(ticket =>
                    ticket.StatusId == TicketStatusIds.Pending),
                Resolved = group.Count(ticket =>
                    ticket.StatusId == TicketStatusIds.Resolved),
                Closed = group.Count(ticket =>
                    ticket.StatusId == TicketStatusIds.Closed),
                Cancelled = group.Count(ticket =>
                    ticket.StatusId == TicketStatusIds.Cancelled)
            })
            .SingleOrDefaultAsync(cancellationToken);

        var averageResolutionSeconds = await query
            .Where(ticket =>
                ticket.ResolvedDate.HasValue &&
                ticket.ResolvedDate.Value >= ticket.CreatedDate)
            .AverageAsync(
                ticket => (double?)EF.Functions.DateDiffSecond(
                    ticket.CreatedDate,
                    ticket.ResolvedDate!.Value),
                cancellationToken);

        var ticketsByStatus = await query
            .GroupBy(ticket => new
            {
                ticket.Status.StatusName,
                ticket.Status.SortOrder
            })
            .Select(group => new
            {
                Name = group.Key.StatusName,
                group.Key.SortOrder,
                Count = group.Count()
            })
            .OrderBy(item => item.SortOrder)
            .Select(item => new ReportChartItemResponse
            {
                Name = item.Name,
                Count = item.Count
            })
            .ToListAsync(cancellationToken);

        var ticketsByPriority = await query
            .GroupBy(ticket => new
            {
                ticket.Priority.PriorityName,
                ticket.Priority.PriorityRank
            })
            .Select(group => new
            {
                Name = group.Key.PriorityName,
                Rank = group.Key.PriorityRank,
                Count = group.Count()
            })
            .OrderBy(item => item.Rank)
            .Select(item => new ReportChartItemResponse
            {
                Name = item.Name,
                Count = item.Count
            })
            .ToListAsync(cancellationToken);

        var ticketsByCategory = await query
            .GroupBy(ticket => ticket.Category.CategoryName)
            .Select(group => new ReportChartItemResponse
            {
                Name = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Name)
            .ToListAsync(cancellationToken);

        var volumeCounts = await query
            .GroupBy(ticket => ticket.CreatedDate.Date)
            .Select(group => new
            {
                Date = group.Key,
                Count = group.Count()
            })
            .OrderBy(item => item.Date)
            .ToListAsync(cancellationToken);

        var countsByDate = volumeCounts.ToDictionary(
            item => DateOnly.FromDateTime(item.Date),
            item => item.Count);

        var ticketVolume = new List<ReportVolumeItemResponse>();

        for (var date = from; date <= to; date = date.AddDays(1))
        {
            ticketVolume.Add(new ReportVolumeItemResponse
            {
                Date = date,
                Count = countsByDate.GetValueOrDefault(date)
            });
        }

        return new ReportSummaryResponse
        {
            From = from,
            To = to,
            TotalTickets = totals?.Total ?? 0,
            OpenTickets = totals?.Open ?? 0,
            InProgressTickets = totals?.InProgress ?? 0,
            PendingTickets = totals?.Pending ?? 0,
            ResolvedTickets = totals?.Resolved ?? 0,
            ClosedTickets = totals?.Closed ?? 0,
            CancelledTickets = totals?.Cancelled ?? 0,
            AverageResolutionMinutes = averageResolutionSeconds / 60,
            TicketsByStatus = ticketsByStatus,
            TicketsByPriority = ticketsByPriority,
            TicketsByCategory = ticketsByCategory,
            TicketVolume = ticketVolume
        };
    }
}
