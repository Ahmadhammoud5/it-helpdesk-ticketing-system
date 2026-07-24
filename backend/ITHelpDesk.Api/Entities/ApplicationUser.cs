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

    // Tickets created by this user.
    public ICollection<Ticket> CreatedTickets { get; set; }
        = new List<Ticket>();

    // Tickets assigned to this user.
    public ICollection<Ticket> AssignedTickets { get; set; }
        = new List<Ticket>();
}