namespace ITHelpDesk.Api.Entities;

public class TicketAssignment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public Ticket Ticket { get; set; } = null!;

    public int AssignedToUserAccountId { get; set; }

    public ApplicationUser AssignedToUserAccount { get; set; } = null!;

    public int AssignedByUserAccountId { get; set; }

    public ApplicationUser AssignedByUserAccount { get; set; } = null!;

    public bool IsEscalation { get; set; }

    public string? AssignmentReason { get; set; }

    public DateTime AssignedDate { get; set; }

    public DateTime? UnassignedDate { get; set; }
}
