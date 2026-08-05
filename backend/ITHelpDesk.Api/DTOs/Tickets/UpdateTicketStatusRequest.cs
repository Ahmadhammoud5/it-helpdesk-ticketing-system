using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Tickets;

public sealed class UpdateTicketStatusRequest
{
    [Range(1, int.MaxValue)]
    public int NewStatusId { get; set; }

    [MaxLength(1000)]
    public string? Reason { get; set; }
}
