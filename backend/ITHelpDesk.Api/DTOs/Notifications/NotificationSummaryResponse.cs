namespace ITHelpDesk.Api.DTOs.Notifications;

public sealed class NotificationSummaryResponse
{
    public int UnreadCount { get; set; }

    public IReadOnlyList<NotificationResponse> Notifications
        { get; set; } = Array.Empty<NotificationResponse>();
}