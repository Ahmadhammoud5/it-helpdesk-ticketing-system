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
public sealed class TicketAssignmentsController
    : ControllerBase
{
    private readonly ITicketAssignmentService
        _ticketAssignmentService;

    public TicketAssignmentsController(
        ITicketAssignmentService ticketAssignmentService)
    {
        _ticketAssignmentService =
            ticketAssignmentService;
    }

    [HttpGet("support-agents")]
    [Authorize(
        Roles =
            SystemRoles.Admin + "," +
            SystemRoles.Manager)]
    public async Task<IActionResult> GetSupportAgents(
        CancellationToken cancellationToken)
    {
        var agents =
            await _ticketAssignmentService
                .GetAgentsAsync(cancellationToken);

        return Ok(agents);
    }

    [HttpPost("{ticketId:int}/assign")]
    [Authorize(
        Roles =
            SystemRoles.Admin + "," +
            SystemRoles.Manager)]
    public async Task<IActionResult> Assign(
        int ticketId,
        [FromBody] AssignTicketRequest request,
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
            await _ticketAssignmentService
                .AssignAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    request,
                    cancellationToken);

        return result.Succeeded
            ? Ok(result.Value)
            : MapFailure(result.Error);
    }

    [HttpPost("{ticketId:int}/unassign")]
    [Authorize(
        Roles =
            SystemRoles.Admin + "," +
            SystemRoles.Manager)]
    public async Task<IActionResult> Unassign(
        int ticketId,
        [FromBody] UnassignTicketRequest request,
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
            await _ticketAssignmentService
                .UnassignAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    request,
                    cancellationToken);

        return result.Succeeded
            ? Ok(result.Value)
            : MapFailure(result.Error);
    }

    [HttpGet("{ticketId:int}/assignment-history")]
    public async Task<IActionResult> GetAssignmentHistory(
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
            await _ticketAssignmentService
                .GetHistoryAsync(
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
        TicketAssignmentError error)
    {
        return error switch
        {
            TicketAssignmentError.TicketNotFound =>
                NotFound(new
                {
                    message =
                        "Ticket was not found."
                }),

            TicketAssignmentError.AgentNotFound =>
                NotFound(new
                {
                    message =
                        "The selected support agent was not found."
                }),

            TicketAssignmentError.Forbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to perform this assignment operation."
                    }),

            TicketAssignmentError.AgentInactive =>
                BadRequest(new
                {
                    message =
                        "The selected support agent is inactive."
                }),

            TicketAssignmentError
                .UserIsNotSupportAgent =>
                BadRequest(new
                {
                    message =
                        "The selected user is not an IT support agent."
                }),

            TicketAssignmentError
                .TicketAlreadyAssignedToAgent =>
                BadRequest(new
                {
                    message =
                        "The ticket is already assigned to this agent."
                }),

            TicketAssignmentError
                .TicketNotAssigned =>
                BadRequest(new
                {
                    message =
                        "The ticket is not currently assigned."
                }),

            TicketAssignmentError.TicketIsFinal =>
                BadRequest(new
                {
                    message =
                        "Closed or cancelled tickets cannot be assigned."
                }),

            _ => Problem(
                detail:
                    "An unexpected assignment error occurred.",
                statusCode:
                    StatusCodes
                        .Status500InternalServerError)
        };
    }
}