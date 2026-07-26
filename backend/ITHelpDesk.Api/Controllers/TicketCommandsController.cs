using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public sealed class TicketCommandsController : ControllerBase
{
    private readonly ITicketCommandService _ticketCommandService;

    public TicketCommandsController(
        ITicketCommandService ticketCommandService)
    {
        _ticketCommandService = ticketCommandService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTicket(
        [FromBody] CreateTicketRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new
            {
                message = "The authenticated user identifier is invalid."
            });
        }

        var result = await _ticketCommandService.CreateAsync(
            userId,
            request,
            cancellationToken);

        if (!result.Succeeded)
        {
            return MapFailure(result.Error);
        }

        if (result.Ticket is null)
        {
            return Problem(
                detail: "The ticket was created but could not be returned.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        return Created(
            $"/api/tickets/{result.Ticket.Id}",
            result.Ticket);
    }

    [HttpPut("{ticketId:int}")]
    public async Task<IActionResult> UpdateTicket(
        int ticketId,
        [FromBody] UpdateTicketRequest request,
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

        var result = await _ticketCommandService.UpdateAsync(
            ticketId,
            userId,
            isAdmin,
            request,
            cancellationToken);

        if (!result.Succeeded)
        {
            return MapFailure(result.Error);
        }

        return Ok(result.Ticket);
    }

    [HttpDelete("{ticketId:int}")]
    public async Task<IActionResult> DeleteTicket(
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

        var result = await _ticketCommandService.DeleteAsync(
            ticketId,
            userId,
            isAdmin,
            cancellationToken);

        if (!result.Succeeded)
        {
            return MapFailure(result.Error);
        }

        return NoContent();
    }

    private bool TryGetCurrentUserId(out int userId)
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        return int.TryParse(userIdValue, out userId);
    }

    private IActionResult MapFailure(TicketCommandError error)
    {
        return error switch
        {
            TicketCommandError.TicketNotFound =>
                NotFound(new
                {
                    message = "Ticket was not found."
                }),

            TicketCommandError.Forbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to modify this ticket."
                    }),

            TicketCommandError.CategoryNotFound =>
                BadRequest(new
                {
                    message =
                        "The selected category does not exist or is inactive."
                }),

            TicketCommandError.PriorityNotFound =>
                BadRequest(new
                {
                    message =
                        "The selected priority does not exist or is inactive."
                }),

            _ => Problem(
                detail: "An unexpected ticket operation error occurred.",
                statusCode: StatusCodes.Status500InternalServerError)
        };
    }
}