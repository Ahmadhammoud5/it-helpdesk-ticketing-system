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
    private readonly IReportService _reportService;

    public ReportsController(
        IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> GetSummary(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var effectiveTo = to ?? today;
        var effectiveFrom = from ?? new DateOnly(
            effectiveTo.Year,
            effectiveTo.Month,
            1);

        if (effectiveFrom > effectiveTo)
        {
            return BadRequest(new
            {
                message =
                    "The 'from' date must be on or before the 'to' date."
            });
        }

        if (effectiveTo == DateOnly.MaxValue)
        {
            return BadRequest(new
            {
                message =
                    "The selected end date is outside the supported range."
            });
        }

        return Ok(await _reportService.GetSummaryAsync(
            effectiveFrom,
            effectiveTo,
            cancellationToken));
    }
}
