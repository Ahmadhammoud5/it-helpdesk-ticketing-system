using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Auth;

public sealed class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression(
        @"^\d{6}$",
        ErrorMessage = "The reset code must contain exactly six digits.")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MinLength(
        8,
        ErrorMessage = "The new password must contain at least 8 characters.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare(
        nameof(NewPassword),
        ErrorMessage = "The password confirmation does not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}