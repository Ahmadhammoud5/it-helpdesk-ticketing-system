using ITHelpDesk.Api.DTOs.Tickets;

namespace ITHelpDesk.Api.Services;

public interface ITicketCommandService
{
    Task<TicketCommandResult> CreateAsync(
        int userId,
        CreateTicketRequest request,
        CancellationToken cancellationToken = default);

    Task<TicketCommandResult> UpdateAsync(
        int ticketId,
        int userId,
        bool isAdmin,
        UpdateTicketRequest request,
        CancellationToken cancellationToken = default);

    Task<TicketCommandResult> DeleteAsync(
        int ticketId,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}