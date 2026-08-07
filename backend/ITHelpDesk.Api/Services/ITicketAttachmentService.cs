using ITHelpDesk.Api.DTOs.Tickets;
using Microsoft.AspNetCore.Http;

namespace ITHelpDesk.Api.Services;

public interface ITicketAttachmentService
{
    Task<TicketAttachmentResult<
        IReadOnlyList<TicketAttachmentResponse>>> GetByTicketIdAsync(
        int ticketId,
        int currentUserId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        CancellationToken cancellationToken);

    Task<TicketAttachmentResult<
        IReadOnlyList<TicketAttachmentResponse>>> UploadAsync(
        int ticketId,
        int currentUserId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        IReadOnlyList<IFormFile> files,
        CancellationToken cancellationToken);

    Task<TicketAttachmentResult<(
        byte[] FileBytes,
        string ContentType,
        string FileName)>> DownloadAsync(
        int ticketId,
        int attachmentId,
        int currentUserId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        CancellationToken cancellationToken);

    Task<TicketAttachmentResult<bool>> DeleteAsync(
        int ticketId,
        int attachmentId,
        int currentUserId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        CancellationToken cancellationToken);
}