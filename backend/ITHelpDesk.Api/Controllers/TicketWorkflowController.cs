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
public sealed class TicketWorkflowController
    : ControllerBase
{
    private readonly ITicketWorkflowService
        _ticketWorkflowService;

    public TicketWorkflowController(
        ITicketWorkflowService ticketWorkflowService)
    {
        _ticketWorkflowService =
            ticketWorkflowService;
    }

    [HttpPut("{ticketId:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int ticketId,
        [FromBody] UpdateTicketStatusRequest request,
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

        var result =
            await _ticketWorkflowService
                .UpdateStatusAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    request,
                    cancellationToken);

        return result.Succeeded
            ? Ok(result.Value)
            : MapFailure(result.Error);
    }

    [HttpGet("{ticketId:int}/timeline")]
    public async Task<IActionResult> GetTimeline(
        int ticketId,
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

        var result =
            await _ticketWorkflowService
                .GetTimelineAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    cancellationToken);

        return result.Succeeded
            ? Ok(result.Value)
            : MapFailure(result.Error);
    }

    [HttpGet("{ticketId:int}/work-time")]
    public async Task<IActionResult> GetWorkTime(
        int ticketId,
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

        var result =
            await _ticketWorkflowService
                .GetWorkTimeAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    cancellationToken);

        return result.Succeeded
            ? Ok(result.Value)
            : MapFailure(result.Error);
    }

    private bool TryGetCurrentUserId(
        out int userId)
    {
        var value = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        return int.TryParse(value, out userId);
    }

    private IActionResult MapFailure(
        TicketWorkflowError error)
    {
        return error switch
        {
            TicketWorkflowError.TicketNotFound =>
                NotFound(new
                {
                    message =
                        "Ticket was not found."
                }),

            TicketWorkflowError.Forbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to perform this ticket operation."
                    }),

            TicketWorkflowError.StatusNotFound =>
                BadRequest(new
                {
                    message =
                        "The selected status does not exist or is inactive."
                }),

            TicketWorkflowError.SameStatus =>
                BadRequest(new
                {
                    message =
                        "The ticket already has this status."
                }),

            TicketWorkflowError
                .InvalidStatusTransition =>
                BadRequest(new
                {
                    message =
                        "This ticket status transition is not allowed."
                }),

            TicketWorkflowError
                .CancellationReasonRequired =>
                BadRequest(new
                {
                    message =
                        "A cancellation reason is required."
                }),

            _ => Problem(
                detail:
                    "An unexpected workflow error occurred.",
                statusCode:
                    StatusCodes
                        .Status500InternalServerError)
        };
    }
}
