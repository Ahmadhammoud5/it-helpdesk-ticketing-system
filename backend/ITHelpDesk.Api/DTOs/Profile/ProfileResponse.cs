namespace ITHelpDesk.Api.DTOs.Profile;

public sealed class ProfileResponse
{
    public int UserId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public int? DepartmentId { get; set; }

    public string? DepartmentName { get; set; }

    public IReadOnlyCollection<string> Roles { get; set; }
        = Array.Empty<string>();

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }

    public bool HasProfilePhoto { get; set; }
}
