namespace ITHelpDesk.Api.Entities;

public class Ticket
{
    public int Id { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public int PriorityId { get; set; }

    public Priority Priority { get; set; } = null!;

    public int StatusId { get; set; }

    public Status Status { get; set; } = null!;

    public int CreatedByUserId { get; set; }

    public ApplicationUser CreatedByUser { get; set; } = null!;

    public int? AssignedToUserId { get; set; }

    public ApplicationUser? AssignedToUser { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime LastUpdatedDate { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? ResolvedDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public bool IsDeleted { get; set; }
}