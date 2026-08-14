using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Admin;

public sealed class UpdateUserStatusRequest
{
    [Required]
    public bool? IsActive { get; set; }
}
