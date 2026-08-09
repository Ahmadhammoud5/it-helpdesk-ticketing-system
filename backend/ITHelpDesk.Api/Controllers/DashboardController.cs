using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(
        IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message =
                    "The authenticated user identifier is invalid."
            });
        }

        var summary =
            await _dashboardService.GetSummaryAsync(
                userId,
                User.IsInRole(SystemRoles.Admin),
                cancellationToken);

        return Ok(summary);
    }

    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message =
                    "The authenticated user identifier is invalid."
            });
        }

        var charts =
            await _dashboardService.GetChartsAsync(
                userId,
                User.IsInRole(SystemRoles.Admin),
                cancellationToken);

        return Ok(charts);
    }

    private bool TryGetCurrentUserId(
        out int userId)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        return int.TryParse(
            userIdValue,
            out userId);
    }
}