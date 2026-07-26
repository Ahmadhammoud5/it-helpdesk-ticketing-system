namespace ITHelpDesk.Api.DTOs.Tickets;

public class TicketResponse
{
    public int Id { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int PriorityId { get; set; }

    public string PriorityName { get; set; } = string.Empty;

    public string PriorityColorCode { get; set; } = string.Empty;

    public int StatusId { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public int CreatedByUserId { get; set; }

    public string CreatedByName { get; set; } = string.Empty;

    public int? AssignedToUserId { get; set; }

    public string? AssignedToName { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime LastUpdatedDate { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? ResolvedDate { get; set; }

    public DateTime? ClosedDate { get; set; }
}