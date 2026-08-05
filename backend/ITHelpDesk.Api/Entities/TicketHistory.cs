namespace ITHelpDesk.Api.Entities;

public class TicketHistory
{
    public long Id { get; set; }

    public int TicketId { get; set; }

    public Ticket Ticket { get; set; } = null!;

    public int ChangedByUserAccountId { get; set; }

    public ApplicationUser ChangedByUserAccount { get; set; } = null!;

    public string FieldName { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime ChangedDate { get; set; }
}
