using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.DTOs.Reports;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = SystemRoles.Admin + "," + SystemRoles.Manager)]
public sealed class ReportsController : ControllerBase
{
    private const string ExcelContentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private const string PdfContentType = "application/pdf";

    private readonly IReportService _reportService;
    private readonly IReportExportService _reportExportService;

    public ReportsController(
        IReportService reportService,
        IReportExportService reportExportService)
    {
        _reportService = reportService;
        _reportExportService = reportExportService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> GetSummary(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        if (!TryResolveDateRange(
                from,
                to,
                out var effectiveFrom,
                out var effectiveTo,
                out var errorMessage))
        {
            return BadRequest(new
            {
                message = errorMessage
            });
        }

        return Ok(await _reportService.GetSummaryAsync(
            effectiveFrom,
            effectiveTo,
            cancellationToken));
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        if (!TryResolveDateRange(
                from,
                to,
                out var effectiveFrom,
                out var effectiveTo,
                out var errorMessage))
        {
            return BadRequest(new
            {
                message = errorMessage
            });
        }

        var report = await _reportService.GetSummaryAsync(
            effectiveFrom,
            effectiveTo,
            cancellationToken);

        var fileBytes = _reportExportService.CreateExcel(
            report,
            DateTime.UtcNow);

        return File(
            fileBytes,
            ExcelContentType,
            CreateFileName(report, "xlsx"));
    }

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        if (!TryResolveDateRange(
                from,
                to,
                out var effectiveFrom,
                out var effectiveTo,
                out var errorMessage))
        {
            return BadRequest(new
            {
                message = errorMessage
            });
        }

        var report = await _reportService.GetSummaryAsync(
            effectiveFrom,
            effectiveTo,
            cancellationToken);

        var fileBytes = _reportExportService.CreatePdf(
            report,
            DateTime.UtcNow);

        return File(
            fileBytes,
            PdfContentType,
            CreateFileName(report, "pdf"));
    }

    private static bool TryResolveDateRange(
        DateOnly? from,
        DateOnly? to,
        out DateOnly effectiveFrom,
        out DateOnly effectiveTo,
        out string? errorMessage)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        effectiveTo = to ?? today;
        effectiveFrom = from ?? new DateOnly(
            effectiveTo.Year,
            effectiveTo.Month,
            1);

        if (effectiveFrom > effectiveTo)
        {
            errorMessage =
                "The 'from' date must be on or before the 'to' date.";
            return false;
        }

        if (effectiveTo == DateOnly.MaxValue)
        {
            errorMessage =
                "The selected end date is outside the supported range.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    private static string CreateFileName(
        ReportSummaryResponse report,
        string extension)
    {
        return $"helpdesk-report-{report.From:yyyy-MM-dd}-to-" +
            $"{report.To:yyyy-MM-dd}.{extension}";
    }
}
