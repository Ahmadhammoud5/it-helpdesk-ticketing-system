namespace ITHelpDesk.Api.DTOs.Tickets;

public class TicketAssignmentResponse
{
    public int TicketId { get; set; }

    public int? AssignedToUserId { get; set; }

    public string? AssignedToName { get; set; }

    public string? AssignedByName { get; set; }

    public bool IsEscalation { get; set; }

    public string? AssignmentReason { get; set; }

    public DateTime AssignedDate { get; set; }

    public DateTime? UnassignedDate { get; set; }
}