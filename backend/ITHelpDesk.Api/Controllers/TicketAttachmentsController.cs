using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public sealed class TicketAttachmentsController
    : ControllerBase
{
    private const long MaxRequestSize =
        55L * 1024L * 1024L;

    private readonly ITicketAttachmentService
        _ticketAttachmentService;

    public TicketAttachmentsController(
        ITicketAttachmentService ticketAttachmentService)
    {
        _ticketAttachmentService =
            ticketAttachmentService;
    }

    [HttpGet("{ticketId:int}/attachments")]
    public async Task<IActionResult> GetAttachments(
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
            await _ticketAttachmentService
                .GetByTicketIdAsync(
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

    [HttpPost("{ticketId:int}/attachments")]
    [RequestSizeLimit(MaxRequestSize)]
    [RequestFormLimits(
        MultipartBodyLengthLimit = MaxRequestSize)]
    public async Task<IActionResult> UploadAttachments(
        int ticketId,
        [FromForm] List<IFormFile> files,
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
            await _ticketAttachmentService
                .UploadAsync(
                    ticketId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    files,
                    cancellationToken);

        return result.Succeeded
            ? StatusCode(
                StatusCodes.Status201Created,
                result.Value)
            : MapFailure(result.Error);
    }

    [HttpGet(
        "{ticketId:int}/attachments/{attachmentId:int}/download")]
    public async Task<IActionResult> DownloadAttachment(
        int ticketId,
        int attachmentId,
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
            await _ticketAttachmentService
                .DownloadAsync(
                    ticketId,
                    attachmentId,
                    userId,
                    User.IsInRole(SystemRoles.Admin),
                    User.IsInRole(SystemRoles.Manager),
                    User.IsInRole(
                        SystemRoles.ITSupportAgent),
                    cancellationToken);

        if (!result.Succeeded)
        {
            return MapFailure(result.Error);
        }

        var file = result.Value;

        return File(
            file.FileBytes,
            file.ContentType,
            file.FileName);
    }

    [HttpDelete(
        "{ticketId:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DeleteAttachment(
        int ticketId,
        int attachmentId,
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
            await _ticketAttachmentService
                .DeleteAsync(
                    ticketId,
                    attachmentId,
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
        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        return int.TryParse(
            value,
            out userId);
    }

    private IActionResult MapFailure(
        TicketAttachmentError error)
    {
        return error switch
        {
            TicketAttachmentError.TicketNotFound =>
                NotFound(new
                {
                    message =
                        "Ticket was not found."
                }),

            TicketAttachmentError
                .AttachmentNotFound =>
                NotFound(new
                {
                    message =
                        "Attachment was not found."
                }),

            TicketAttachmentError.Forbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You are not authorized to perform this attachment operation."
                    }),

            TicketAttachmentError.NoFiles =>
                BadRequest(new
                {
                    message =
                        "At least one non-empty file is required."
                }),

            TicketAttachmentError.TooManyFiles =>
                BadRequest(new
                {
                    message =
                        "A maximum of 5 files can be uploaded at once."
                }),

            TicketAttachmentError.FileTooLarge =>
                StatusCode(
                    StatusCodes
                        .Status413PayloadTooLarge,
                    new
                    {
                        message =
                            "Each attachment must not exceed 10 MB."
                    }),

            TicketAttachmentError
                .TicketStorageLimitExceeded =>
                StatusCode(
                    StatusCodes
                        .Status413PayloadTooLarge,
                    new
                    {
                        message =
                            "The ticket attachment limit of 50 MB would be exceeded."
                    }),

            TicketAttachmentError
                .UnsupportedFileType =>
                StatusCode(
                    StatusCodes
                        .Status415UnsupportedMediaType,
                    new
                    {
                        message =
                            "The selected file type is not supported."
                    }),

            TicketAttachmentError
                .InvalidFileName =>
                BadRequest(new
                {
                    message =
                        "The attachment file name is invalid."
                }),

            TicketAttachmentError
                .FileNotFoundOnDisk =>
                NotFound(new
                {
                    message =
                        "The attachment file could not be found."
                }),

            _ => Problem(
                detail:
                    "An unexpected attachment error occurred.",
                statusCode:
                    StatusCodes
                        .Status500InternalServerError)
        };
    }
}