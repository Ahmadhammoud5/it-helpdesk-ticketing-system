namespace ITHelpDesk.Api.DTOs.Tickets;

public class AssignTicketRequest
{
    public int SupportAgentId { get; set; }

    public bool IsEscalation { get; set; }

    public string? AssignmentReason { get; set; }
}