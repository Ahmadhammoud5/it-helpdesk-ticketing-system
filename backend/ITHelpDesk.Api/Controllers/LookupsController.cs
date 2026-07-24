using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public sealed class LookupsController : ControllerBase
{
    private readonly ITicketQueryService _ticketQueryService;

    public LookupsController(
        ITicketQueryService ticketQueryService)
    {
        _ticketQueryService = ticketQueryService;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(
        CancellationToken cancellationToken)
    {
        var categories =
            await _ticketQueryService.GetCategoriesAsync(
                cancellationToken);

        return Ok(categories);
    }

    [HttpGet("priorities")]
    public async Task<IActionResult> GetPriorities(
        CancellationToken cancellationToken)
    {
        var priorities =
            await _ticketQueryService.GetPrioritiesAsync(
                cancellationToken);

        return Ok(priorities);
    }

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses(
        CancellationToken cancellationToken)
    {
        var statuses =
            await _ticketQueryService.GetStatusesAsync(
                cancellationToken);

        return Ok(statuses);
    }
}