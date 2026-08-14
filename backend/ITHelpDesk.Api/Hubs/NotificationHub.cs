using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ITHelpDesk.Api.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
    public const string AdminPresenceGroup =
        "presence-viewers:admins";

    public const string ManagerPresenceGroup =
        "presence-viewers:managers";

    private readonly IPresenceService _presenceService;

    public NotificationHub(IPresenceService presenceService)
    {
        _presenceService = presenceService;
    }

    public override async Task OnConnectedAsync()
    {
        var userIdValue = Context.User?
            .FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetUserGroup(userIdValue));

        if (Context.User!.IsInRole(SystemRoles.Admin))
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                AdminPresenceGroup);
        }

        if (Context.User.IsInRole(SystemRoles.Manager))
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                ManagerPresenceGroup);
        }

        await _presenceService.ConnectionOpenedAsync(
            userId,
            Context.ConnectionId,
            Context.User.IsInRole(SystemRoles.ITSupportAgent),
            Context.ConnectionAborted);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(
        Exception? exception)
    {
        var userIdValue = Context.User?
            .FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(userIdValue, out var userId))
        {
            _presenceService.ConnectionClosed(
                userId,
                Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public static string GetUserGroup(string userId)
    {
        return $"user:{userId}";
    }
}
