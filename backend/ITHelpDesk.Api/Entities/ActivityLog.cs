namespace ITHelpDesk.Api.Entities;

public class ActivityLog
{
    public long Id { get; set; }

    public int? UserAccountId { get; set; }

    public ApplicationUser? UserAccount { get; set; }

    public int? TicketId { get; set; }

    public Ticket? Ticket { get; set; }

    public string ActivityType { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    public string? IpAddress { get; set; }

    public DateTime CreatedDate { get; set; }
}
