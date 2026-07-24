using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public sealed class TicketQueriesController : ControllerBase
{
    private readonly ITicketQueryService _ticketQueryService;

    public TicketQueriesController(
        ITicketQueryService ticketQueryService)
    {
        _ticketQueryService = ticketQueryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message = "The authenticated user identifier is invalid."
            });
        }

        var isAdmin = User.IsInRole(SystemRoles.Admin);

        var tickets = await _ticketQueryService.GetTicketsAsync(
            userId,
            isAdmin,
            cancellationToken);

        return Ok(tickets);
    }

    [HttpGet("{ticketId:int}")]
    public async Task<IActionResult> GetTicketById(
        int ticketId,
        CancellationToken cancellationToken)
    {
        if (ticketId <= 0)
        {
            return BadRequest(new
            {
                message = "Ticket ID must be greater than zero."
            });
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message = "The authenticated user identifier is invalid."
            });
        }

        var isAdmin = User.IsInRole(SystemRoles.Admin);

        var ticket = await _ticketQueryService.GetTicketByIdAsync(
            ticketId,
            userId,
            isAdmin,
            cancellationToken);

        if (ticket is null)
        {
            return NotFound(new
            {
                message = "Ticket was not found."
            });
        }

        return Ok(ticket);
    }

    private bool TryGetCurrentUserId(out int userId)
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        return int.TryParse(userIdValue, out userId);
    }
}