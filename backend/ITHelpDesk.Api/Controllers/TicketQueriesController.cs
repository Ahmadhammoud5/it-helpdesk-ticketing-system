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
        [FromQuery] int? assignedTo,
        [FromQuery] string? assignment,
        CancellationToken cancellationToken)
    {
        if (assignedTo <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Assigned support-agent ID must be greater than zero."
            });
        }

        var unassignedOnly = string.Equals(
            assignment,
            "unassigned",
            StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(assignment) &&
            !unassignedOnly)
        {
            return BadRequest(new
            {
                message =
                    "Assignment filter must be 'unassigned'."
            });
        }

        if (assignedTo.HasValue && unassignedOnly)
        {
            return BadRequest(new
            {
                message =
                    "Choose either an assigned agent or unassigned tickets, not both."
            });
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message =
                    "The authenticated user identifier is invalid."
            });
        }

        var tickets =
            await _ticketQueryService.GetTicketsAsync(
                userId,
                User.IsInRole(SystemRoles.Admin),
                User.IsInRole(SystemRoles.Manager),
                User.IsInRole(SystemRoles.ITSupportAgent),
                assignedTo,
                unassignedOnly,
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
                message =
                    "Ticket ID must be greater than zero."
            });
        }

        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message =
                    "The authenticated user identifier is invalid."
            });
        }

        var ticket =
            await _ticketQueryService.GetTicketByIdAsync(
                ticketId,
                userId,
                User.IsInRole(SystemRoles.Admin),
                User.IsInRole(SystemRoles.Manager),
                User.IsInRole(SystemRoles.ITSupportAgent),
                cancellationToken);

        if (ticket is null)
        {
            if (await _ticketQueryService.TicketExistsAsync(
                    ticketId,
                    cancellationToken))
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to view this ticket."
                    });
            }

            return NotFound(new
            {
                message = "Ticket was not found."
            });
        }

        return Ok(ticket);
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
