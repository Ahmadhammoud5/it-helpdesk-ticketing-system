using Microsoft.AspNetCore.Identity;

namespace ITHelpDesk.Api.Entities;

public class ApplicationUser : IdentityUser<int>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }

    public Department? Department { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginDate { get; set; }

    public ICollection<PasswordResetCode> PasswordResetCodes { get; set; }
        = new List<PasswordResetCode>();

    public ICollection<Ticket> CreatedTickets { get; set; }
        = new List<Ticket>();

    public ICollection<Ticket> AssignedTickets { get; set; }
        = new List<Ticket>();

    public ICollection<Ticket> DeletedTickets { get; set; }
        = new List<Ticket>();

    public ICollection<TicketAssignment> TicketAssignmentsReceived
        { get; set; } = new List<TicketAssignment>();

    public ICollection<TicketAssignment> TicketAssignmentsMade
        { get; set; } = new List<TicketAssignment>();

    public ICollection<TicketHistory> TicketHistoryChanges
        { get; set; } = new List<TicketHistory>();

    public ICollection<TicketComment> TicketComments
        { get; set; } = new List<TicketComment>();

    public ICollection<TicketComment> DeletedTicketComments
        { get; set; } = new List<TicketComment>();

    public ICollection<ActivityLog> ActivityLogs
        { get; set; } = new List<ActivityLog>();
}
