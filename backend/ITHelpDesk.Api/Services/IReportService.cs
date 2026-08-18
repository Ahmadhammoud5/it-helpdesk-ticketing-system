using ITHelpDesk.Api.DTOs.Reports;

namespace ITHelpDesk.Api.Services;

public interface IReportService
{
    Task<ReportSummaryResponse> GetSummaryAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default);
}
