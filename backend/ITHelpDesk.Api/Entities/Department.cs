namespace ITHelpDesk.Api.Entities;

public class Department
{
    public int Id { get; set; }

    public string DepartmentName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<ApplicationUser> Users { get; set; }
        = new List<ApplicationUser>();
}