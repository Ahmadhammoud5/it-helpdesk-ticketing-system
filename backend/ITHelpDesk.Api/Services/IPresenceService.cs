namespace ITHelpDesk.Api.Services;

public interface IPresenceService
{
    bool IsOnline(int userId);

    Task ConnectionOpenedAsync(
        int userId,
        string connectionId,
        bool isSupportAgent,
        CancellationToken cancellationToken = default);

    void ConnectionClosed(
        int userId,
        string connectionId);

    Task DisconnectUserAsync(
        int userId,
        string clientEvent,
        DateTime lastSeenUtc,
        CancellationToken cancellationToken = default);
}
