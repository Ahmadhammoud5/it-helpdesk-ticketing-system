using ITHelpDesk.Api.DTOs.Reports;

namespace ITHelpDesk.Api.Services;

public interface IReportExportService
{
    byte[] CreateExcel(
        ReportSummaryResponse report,
        DateTime generatedAtUtc);

    byte[] CreatePdf(
        ReportSummaryResponse report,
        DateTime generatedAtUtc);
}
