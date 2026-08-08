namespace ITHelpDesk.Api.DTOs.Notifications;

public sealed class NotificationResponse
{
    public int Id { get; set; }

    public int? TicketId { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? ReadDate { get; set; }
}