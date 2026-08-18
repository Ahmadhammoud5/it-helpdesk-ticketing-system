using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Profile;

public sealed class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare(
        nameof(NewPassword),
        ErrorMessage =
            "The new password and confirmation do not match.")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}
