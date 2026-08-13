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
public sealed class TicketCommentsController
    : ControllerBase
{
    private readonly ITicketCommentService
        _ticketCommentService;

    public TicketCommentsController(
        ITicketCommentService ticketCommentService)
    {
        _ticketCommentService =
            ticketCommentService;
    }

    [HttpGet("{ticketId:int}/comments")]
    public async Task<IActionResult> GetComments(
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
            await _ticketCommentService
                .GetCommentsAsync(
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

    [HttpPost("{ticketId:int}/comments")]
    public async Task<IActionResult> CreateComment(
        int ticketId,
        [FromBody] CreateTicketCommentRequest request,
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
            await _ticketCommentService
                .CreateCommentAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    request,
                    cancellationToken);

        return result.Succeeded
            ? StatusCode(
                StatusCodes.Status201Created,
                result.Value)
            : MapFailure(result.Error);
    }

    [HttpPut(
        "{ticketId:int}/comments/{commentId:int}")]
    public async Task<IActionResult> UpdateComment(
        int ticketId,
        int commentId,
        [FromBody] UpdateTicketCommentRequest request,
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
            await _ticketCommentService
                .UpdateCommentAsync(
                    ticketId,
                    commentId,
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

    [HttpDelete(
        "{ticketId:int}/comments/{commentId:int}")]
    public async Task<IActionResult> DeleteComment(
        int ticketId,
        int commentId,
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
            await _ticketCommentService
                .DeleteCommentAsync(
                    ticketId,
                    commentId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    cancellationToken);

        return result.Succeeded
            ? NoContent()
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
        TicketCommentError error)
    {
        return error switch
        {
            TicketCommentError.TicketNotFound =>
                NotFound(new
                {
                    message =
                        "Ticket was not found."
                }),

            TicketCommentError.CommentNotFound =>
                NotFound(new
                {
                    message =
                        "Comment was not found."
                }),

            TicketCommentError.Forbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to perform this comment operation."
                    }),

            TicketCommentError.EmptyComment =>
                BadRequest(new
                {
                    message =
                        "Comment text is required."
                }),

            TicketCommentError.CommentTooLong =>
                BadRequest(new
                {
                    message =
                        "Comment text cannot exceed 5000 characters."
                }),

            TicketCommentError
                .InternalCommentForbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to create internal comments."
                    }),

            TicketCommentError.TicketIsFinal =>
                BadRequest(new
                {
                    message =
                        "Comments cannot be added or edited on closed or cancelled tickets."
                }),

            _ => Problem(
                detail:
                    "An unexpected comment error occurred.",
                statusCode:
                    StatusCodes
                        .Status500InternalServerError)
        };
    }
}
