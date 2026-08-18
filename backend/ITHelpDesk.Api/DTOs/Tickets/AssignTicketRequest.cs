using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Tickets;

public class AssignTicketRequest
{
    [Range(1, int.MaxValue)]
    public int SupportAgentId { get; set; }

    public bool IsEscalation { get; set; }

    [StringLength(255)]
    public string? AssignmentReason { get; set; }
}
