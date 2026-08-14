namespace ITHelpDesk.Api.DTOs.Admin;

public sealed class AdminUserResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public bool IsActive { get; set; }

    public bool IsOnline { get; set; }

    public DateTime? LastSeenUtc { get; set; }

    public string[] Roles { get; set; } = [];
}
