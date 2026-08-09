using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ITHelpDesk.Api.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (!string.IsNullOrWhiteSpace(Context.UserIdentifier))
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                GetUserGroup(Context.UserIdentifier));
        }

        await base.OnConnectedAsync();
    }

    public static string GetUserGroup(string userId)
    {
        return $"user:{userId}";
    }
}