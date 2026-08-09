using System.Security.Claims;
using ITHelpDesk.Api.DTOs.Notifications;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(
        INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationSummaryResponse>> Get(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var result =
            await _notificationService.GetForUserAsync(
                userId,
                cancellationToken);

        return Ok(result);
    }

    [HttpPut("{notificationId:int}/read")]
    public async Task<ActionResult<NotificationResponse>> MarkAsRead(
        int notificationId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var notification =
            await _notificationService.MarkAsReadAsync(
                notificationId,
                userId,
                cancellationToken);

        if (notification is null)
        {
            return NotFound();
        }

        return Ok(notification);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var updatedCount =
            await _notificationService.MarkAllAsReadAsync(
                userId,
                cancellationToken);

        return Ok(new
        {
            updatedCount
        });
    }

    private bool TryGetCurrentUserId(out int userId)
    {
        return int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out userId);
    }
}