using ITHelpDesk.Api.DTOs.Tickets;

namespace ITHelpDesk.Api.Services;

public interface ITicketCommentService
{
    Task<TicketCommentResult<List<TicketCommentResponse>>>
        GetCommentsAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CancellationToken cancellationToken);

    Task<TicketCommentResult<TicketCommentResponse>>
        CreateCommentAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CreateTicketCommentRequest request,
            CancellationToken cancellationToken);

    Task<TicketCommentResult<TicketCommentResponse>>
        UpdateCommentAsync(
            int ticketId,
            int commentId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            UpdateTicketCommentRequest request,
            CancellationToken cancellationToken);

    Task<TicketCommentResult<bool>>
        DeleteCommentAsync(
            int ticketId,
            int commentId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CancellationToken cancellationToken);
}
