using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Tickets;

public class UnassignTicketRequest
{
    [StringLength(255)]
    public string? AssignmentReason { get; set; }
}
