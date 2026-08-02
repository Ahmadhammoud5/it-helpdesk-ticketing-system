using ITHelpDesk.Api.DTOs.Tickets;

namespace ITHelpDesk.Api.Services;

public interface ITicketAssignmentService
{
    Task<List<SupportAgentResponse>> GetAgentsAsync(
        CancellationToken cancellationToken);

    Task<TicketAssignmentResult<TicketAssignmentResponse>>
        AssignAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            AssignTicketRequest request,
            CancellationToken cancellationToken);

    Task<TicketAssignmentResult<TicketAssignmentResponse>>
        UnassignAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            UnassignTicketRequest request,
            CancellationToken cancellationToken);

    Task<TicketAssignmentResult<List<TicketAssignmentResponse>>>
        GetHistoryAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CancellationToken cancellationToken);
}