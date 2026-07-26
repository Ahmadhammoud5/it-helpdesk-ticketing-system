using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Tickets;

public class UpdateTicketRequest
{
    [Required]
    [StringLength(200, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(5000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }

    [Range(1, int.MaxValue)]
    public int PriorityId { get; set; }
}