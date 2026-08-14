using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Notifications;
using ITHelpDesk.Api.Entities;
using ITHelpDesk.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class NotificationService
    : INotificationService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ApplicationDbContext dbContext,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<NotificationResponse> CreateAsync(
        int userId,
        int? ticketId,
        string type,
        string title,
        string message,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            TicketId = ticketId,
            Type = type.Trim(),
            Title = title.Trim(),
            Message = message.Trim(),
            IsRead = false,
            CreatedDate = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var response = Map(notification);

        await BroadcastAsync(
            userId,
            response,
            cancellationToken);

        return response;
    }

    public async Task<int> CreateForUsersAsync(
        IReadOnlyCollection<int> userIds,
        int? ticketId,
        string type,
        string title,
        string message,
        CancellationToken cancellationToken = default)
    {
        var distinctUserIds = userIds
            .Where(userId => userId > 0)
            .Distinct()
            .ToArray();

        if (distinctUserIds.Length == 0)
        {
            return 0;
        }

        var activeUserIds = await _dbContext.Users
            .AsNoTracking()
            .Where(user =>
                distinctUserIds.Contains(user.Id) &&
                user.IsActive)
            .Select(user => user.Id)
            .ToListAsync(cancellationToken);

        if (activeUserIds.Count == 0)
        {
            return 0;
        }

        var now = DateTime.UtcNow;
        var notifications = activeUserIds
            .Select(userId => new Notification
            {
                UserId = userId,
                TicketId = ticketId,
                Type = type.Trim(),
                Title = title.Trim(),
                Message = message.Trim(),
                IsRead = false,
                CreatedDate = now
            })
            .ToList();

        _dbContext.Notifications.AddRange(notifications);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        foreach (var notification in notifications)
        {
            await BroadcastAsync(
                notification.UserId,
                Map(notification),
                cancellationToken);
        }

        return notifications.Count;
    }

    public async Task<NotificationSummaryResponse> GetForUserAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var unreadCount = await _dbContext.Notifications
            .AsNoTracking()
            .CountAsync(
                notification =>
                    notification.UserId == userId &&
                    !notification.IsRead,
                cancellationToken);

        var notifications = await _dbContext.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.UserId == userId)
            .OrderByDescending(notification =>
                notification.CreatedDate)
            .Take(50)
            .Select(notification =>
                new NotificationResponse
                {
                    Id = notification.Id,
                    TicketId = notification.TicketId,
                    Type = notification.Type,
                    Title = notification.Title,
                    Message = notification.Message,
                    IsRead = notification.IsRead,
                    CreatedDate = notification.CreatedDate,
                    ReadDate = notification.ReadDate
                })
            .ToListAsync(cancellationToken);

        return new NotificationSummaryResponse
        {
            UnreadCount = unreadCount,
            Notifications = notifications
        };
    }

    public async Task<NotificationResponse?> MarkAsReadAsync(
        int notificationId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(
                item =>
                    item.Id == notificationId &&
                    item.UserId == userId,
                cancellationToken);

        if (notification is null)
        {
            return null;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadDate = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }

        return Map(notification);
    }

    public async Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var readDate = DateTime.UtcNow;

        return await _dbContext.Notifications
            .Where(notification =>
                notification.UserId == userId &&
                !notification.IsRead)
            .ExecuteUpdateAsync(
                updates => updates
                    .SetProperty(
                        notification => notification.IsRead,
                        true)
                    .SetProperty(
                        notification => notification.ReadDate,
                        readDate),
                cancellationToken);
    }

    private static NotificationResponse Map(
        Notification notification)
    {
        return new NotificationResponse
        {
            Id = notification.Id,
            TicketId = notification.TicketId,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedDate = notification.CreatedDate,
            ReadDate = notification.ReadDate
        };
    }

    private async Task BroadcastAsync(
        int userId,
        NotificationResponse notification,
        CancellationToken cancellationToken)
    {
        try
        {
            await _hubContext.Clients
                .Group(
                    NotificationHub.GetUserGroup(
                        userId.ToString()))
                .SendAsync(
                    "notificationReceived",
                    notification,
                    cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Notification {NotificationId} was persisted but could not be delivered in real time to user {UserId}.",
                notification.Id,
                userId);
        }
    }
}
