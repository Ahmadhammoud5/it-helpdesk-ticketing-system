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

    public DateTime? CancelledDate { get; set; }

    // Set whenever the ticket enters In Progress.
    public DateTime? WorkStartedAtUtc { get; set; }

    // Total actual work time, excluding Open and Pending time.
    public int AccumulatedWorkMinutes { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedDate { get; set; }

    public int? DeletedByUserId { get; set; }

    public ApplicationUser? DeletedByUser { get; set; }

    public ICollection<TicketAssignment> Assignments { get; set; }
        = new List<TicketAssignment>();

    public ICollection<TicketHistory> History { get; set; }
        = new List<TicketHistory>();

    public ICollection<TicketComment> Comments { get; set; }
        = new List<TicketComment>();

    public ICollection<TicketAttachment> Attachments { get; set; }
        = new List<TicketAttachment>();

    public ICollection<ActivityLog> ActivityLogs { get; set; }
        = new List<ActivityLog>();

    public ICollection<Notification> Notifications { get; set; }
        = new List<Notification>();
}