using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Admin;

public sealed class UpdateUserRoleRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}