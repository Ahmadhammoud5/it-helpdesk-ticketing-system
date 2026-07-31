using ITHelpDesk.Api.DTOs.Tickets;

namespace ITHelpDesk.Api.Services;

public interface ITicketWorkflowService
{
    Task<TicketWorkflowResult<TicketStatusUpdateResponse>>
        UpdateStatusAsync(
            int ticketId,
            int userId,
            bool isAdmin,
            bool isManager,
            bool isAgent,
            UpdateTicketStatusRequest request,
            CancellationToken cancellationToken = default);

    Task<TicketWorkflowResult<IReadOnlyList<TicketTimelineItemResponse>>>
        GetTimelineAsync(
            int ticketId,
            int userId,
            bool isAdmin,
            bool isManager,
            bool isAgent,
            CancellationToken cancellationToken = default);

    Task<TicketWorkflowResult<TicketWorkTimeResponse>>
        GetWorkTimeAsync(
            int ticketId,
            int userId,
            bool isAdmin,
            bool isManager,
            bool isAgent,
            CancellationToken cancellationToken = default);
}
