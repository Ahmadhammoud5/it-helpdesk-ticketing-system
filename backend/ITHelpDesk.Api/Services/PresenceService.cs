using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Presence;
using ITHelpDesk.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class PresenceService : IPresenceService
{
    private static readonly TimeSpan OfflineDelay =
        TimeSpan.FromSeconds(5);

    private readonly object _syncRoot = new();
    private readonly Dictionary<int, UserPresence> _users = [];
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<PresenceService> _logger;

    public PresenceService(
        IServiceScopeFactory scopeFactory,
        IHubContext<NotificationHub> hubContext,
        ILogger<PresenceService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    public bool IsOnline(int userId)
    {
        lock (_syncRoot)
        {
            return _users.TryGetValue(userId, out var presence) &&
                presence.IsOnline;
        }
    }

    public async Task ConnectionOpenedAsync(
        int userId,
        string connectionId,
        bool isSupportAgent,
        CancellationToken cancellationToken = default)
    {
        var shouldBroadcast = false;

        lock (_syncRoot)
        {
            if (!_users.TryGetValue(userId, out var presence))
            {
                presence = new UserPresence();
                _users[userId] = presence;
            }

            presence.PendingOffline?.Cancel();
            presence.PendingOffline?.Dispose();
            presence.PendingOffline = null;
            presence.ConnectionIds.Add(connectionId);
            presence.IsSupportAgent = isSupportAgent;

            if (!presence.IsOnline)
            {
                presence.IsOnline = true;
                shouldBroadcast = true;
            }
        }

        if (shouldBroadcast)
        {
            await BroadcastAsync(
                new PresenceUpdateResponse
                {
                    UserId = userId,
                    IsOnline = true
                },
                isSupportAgent,
                cancellationToken);
        }
    }

    public void ConnectionClosed(
        int userId,
        string connectionId)
    {
        CancellationTokenSource? pendingOffline = null;

        lock (_syncRoot)
        {
            if (!_users.TryGetValue(userId, out var presence))
            {
                return;
            }

            presence.ConnectionIds.Remove(connectionId);

            if (presence.ConnectionIds.Count > 0 ||
                !presence.IsOnline ||
                presence.PendingOffline is not null)
            {
                return;
            }

            pendingOffline = new CancellationTokenSource();
            presence.PendingOffline = pendingOffline;
        }

        _ = CompleteOfflineAfterDelayAsync(
            userId,
            pendingOffline);
    }

    public async Task DisconnectUserAsync(
        int userId,
        string clientEvent,
        DateTime lastSeenUtc,
        CancellationToken cancellationToken = default)
    {
        string[] connectionIds;
        bool wasOnline;
        bool isSupportAgent;

        lock (_syncRoot)
        {
            if (!_users.Remove(userId, out var presence))
            {
                return;
            }

            presence.PendingOffline?.Cancel();
            presence.PendingOffline?.Dispose();
            connectionIds = [.. presence.ConnectionIds];
            wasOnline = presence.IsOnline;
            isSupportAgent = presence.IsSupportAgent;
        }

        if (connectionIds.Length > 0)
        {
            try
            {
                await _hubContext.Clients
                    .Clients(connectionIds)
                    .SendAsync(
                        clientEvent,
                        cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Failed to notify user {UserId} that the session was invalidated.",
                    userId);
            }
        }

        foreach (var connectionId in connectionIds)
        {
            await RemoveFromGroupsAsync(
                userId,
                connectionId,
                cancellationToken);
        }

        if (wasOnline)
        {
            try
            {
                await BroadcastAsync(
                    new PresenceUpdateResponse
                    {
                        UserId = userId,
                        IsOnline = false,
                        LastSeenUtc = lastSeenUtc
                    },
                    isSupportAgent,
                    cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Failed to broadcast the forced offline state for user {UserId}.",
                    userId);
            }
        }
    }

    private async Task RemoveFromGroupsAsync(
        int userId,
        string connectionId,
        CancellationToken cancellationToken)
    {
        var groups = new[]
        {
            NotificationHub.GetUserGroup(userId.ToString()),
            NotificationHub.AdminPresenceGroup,
            NotificationHub.ManagerPresenceGroup
        };

        foreach (var group in groups)
        {
            try
            {
                await _hubContext.Groups.RemoveFromGroupAsync(
                    connectionId,
                    group,
                    cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Failed to remove connection {ConnectionId} from SignalR group {Group}.",
                    connectionId,
                    group);
            }
        }
    }

    private async Task CompleteOfflineAfterDelayAsync(
        int userId,
        CancellationTokenSource pendingOffline)
    {
        try
        {
            await Task.Delay(
                OfflineDelay,
                pendingOffline.Token);

            bool isSupportAgent;

            lock (_syncRoot)
            {
                if (!_users.TryGetValue(userId, out var presence) ||
                    presence.PendingOffline != pendingOffline ||
                    presence.ConnectionIds.Count > 0)
                {
                    return;
                }

                presence.PendingOffline = null;
                presence.IsOnline = false;
                isSupportAgent = presence.IsSupportAgent;
                _users.Remove(userId);
            }

            var lastSeenUtc = DateTime.UtcNow;

            await PersistLastSeenAsync(
                userId,
                lastSeenUtc);

            await BroadcastAsync(
                new PresenceUpdateResponse
                {
                    UserId = userId,
                    IsOnline = false,
                    LastSeenUtc = lastSeenUtc
                },
                isSupportAgent);
        }
        catch (OperationCanceledException)
        {
            // A quick reconnect preserves the user's online state.
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to complete the offline transition for user {UserId}.",
                userId);
        }
        finally
        {
            pendingOffline.Dispose();
        }
    }

    private async Task PersistLastSeenAsync(
        int userId,
        DateTime lastSeenUtc)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();

            var dbContext = scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

            await dbContext.Users
                .Where(user => user.Id == userId)
                .ExecuteUpdateAsync(updates => updates
                    .SetProperty(
                        user => user.LastSeenUtc,
                        lastSeenUtc));
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to persist the last-seen time for user {UserId}.",
                userId);
        }
    }

    private async Task BroadcastAsync(
        PresenceUpdateResponse update,
        bool isSupportAgent,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group(NotificationHub.AdminPresenceGroup)
            .SendAsync(
                "presenceChanged",
                update,
                cancellationToken);

        if (isSupportAgent)
        {
            await _hubContext.Clients
                .Group(NotificationHub.ManagerPresenceGroup)
                .SendAsync(
                    "presenceChanged",
                    update,
                    cancellationToken);
        }
    }

    private sealed class UserPresence
    {
        public HashSet<string> ConnectionIds { get; } = [];

        public bool IsOnline { get; set; }

        public bool IsSupportAgent { get; set; }

        public CancellationTokenSource? PendingOffline { get; set; }
    }
}
