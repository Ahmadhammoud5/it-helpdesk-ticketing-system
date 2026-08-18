using System.ComponentModel.DataAnnotations;

namespace ITHelpDesk.Api.DTOs.Profile;

public sealed class UpdateProfileRequest
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(30)]
    [RegularExpression(
        @"^[0-9+().\-\s]*$",
        ErrorMessage =
            "Phone number contains unsupported characters.")]
    public string? PhoneNumber { get; set; }
}
