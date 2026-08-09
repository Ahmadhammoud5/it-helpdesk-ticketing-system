namespace ITHelpDesk.Api.Entities;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public int? TicketId { get; set; }

    public Ticket? Ticket { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? ReadDate { get; set; }
}