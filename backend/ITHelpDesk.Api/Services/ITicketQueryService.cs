using ITHelpDesk.Api.DTOs.Lookups;
using ITHelpDesk.Api.DTOs.Tickets;

namespace ITHelpDesk.Api.Services;

public interface ITicketQueryService
{
    Task<IReadOnlyList<TicketResponse>> GetTicketsAsync(
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<TicketResponse?> GetTicketByIdAsync(
        int ticketId,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryResponse>> GetCategoriesAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PriorityResponse>> GetPrioritiesAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StatusResponse>> GetStatusesAsync(
        CancellationToken cancellationToken = default);
}