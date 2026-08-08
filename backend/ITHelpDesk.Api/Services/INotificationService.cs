using ITHelpDesk.Api.DTOs.Notifications;

namespace ITHelpDesk.Api.Services;

public interface INotificationService
{
    Task<NotificationResponse> CreateAsync(
        int userId,
        int? ticketId,
        string type,
        string title,
        string message,
        CancellationToken cancellationToken = default);

    Task<NotificationSummaryResponse> GetForUserAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<NotificationResponse?> MarkAsReadAsync(
        int notificationId,
        int userId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken = default);
}