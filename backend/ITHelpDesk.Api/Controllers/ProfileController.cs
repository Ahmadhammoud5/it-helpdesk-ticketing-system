using System.Data;
using System.Security.Claims;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Profile;
using ITHelpDesk.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class ProfileController : ControllerBase
{
    private const long MaxPhotoSizeBytes = 2L * 1024L * 1024L;
    private const long MaxPhotoRequestSize = 3L * 1024L * 1024L;

    private static readonly IReadOnlyDictionary<string, string>
        AllowedImageTypes =
            new Dictionary<string, string>(
                StringComparer.OrdinalIgnoreCase)
            {
                [".jpg"] = "image/jpeg",
                [".jpeg"] = "image/jpeg",
                [".png"] = "image/png",
                [".webp"] = "image/webp"
            };

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ProfileController> _logger;
    private readonly string _photoStoragePath;

    public ProfileController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        IWebHostEnvironment environment,
        ILogger<ProfileController> logger)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _logger = logger;
        _photoStoragePath = Path.GetFullPath(
            Path.Combine(
                environment.ContentRootPath,
                "Uploads",
                "ProfilePhotos"));

        Directory.CreateDirectory(_photoStoragePath);
    }

    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> GetProfile(
        CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        return Ok(await CreateResponseAsync(
            user,
            cancellationToken));
    }

    [HttpPut]
    public async Task<ActionResult<ProfileResponse>> UpdateProfile(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        var firstName = request.FirstName.Trim();
        var lastName = request.LastName.Trim();
        var phoneNumber = string.IsNullOrWhiteSpace(
                request.PhoneNumber)
            ? null
            : request.PhoneNumber.Trim();

        if (firstName.Length == 0 || lastName.Length == 0)
        {
            return BadRequest(new
            {
                message = "First name and last name are required."
            });
        }

        user.FirstName = firstName;
        user.LastName = lastName;
        user.PhoneNumber = phoneNumber;

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "The profile could not be updated.",
                errors = result.Errors.Select(error => new
                {
                    code = error.Code,
                    description = error.Description
                })
            });
        }

        return Ok(await CreateResponseAsync(
            user,
            cancellationToken));
    }

    [HttpPost("photo")]
    [RequestSizeLimit(MaxPhotoRequestSize)]
    [RequestFormLimits(
        MultipartBodyLengthLimit = MaxPhotoRequestSize)]
    public async Task<ActionResult<ProfileResponse>> UploadPhoto(
        [FromForm] IFormFile? photo,
        CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        var validation = await ValidatePhotoAsync(
            photo,
            cancellationToken);

        if (!validation.IsValid)
        {
            return BadRequest(new
            {
                message = validation.ErrorMessage
            });
        }

        var storedFileName =
            $"{Guid.NewGuid():N}{validation.Extension}";
        var newPhotoPath = GetSafePhotoPath(storedFileName)!;
        var previousFileName = user.ProfilePhotoFileName;

        try
        {
            await using (var targetStream = new FileStream(
                newPhotoPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true))
            {
                await photo!.CopyToAsync(
                    targetStream,
                    cancellationToken);
            }

            user.ProfilePhotoFileName = storedFileName;
            var updateResult = await _userManager.UpdateAsync(user);

            if (!updateResult.Succeeded)
            {
                user.ProfilePhotoFileName = previousFileName;
                TryDeletePhoto(storedFileName);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "The profile photo could not be saved."
                    });
            }
        }
        catch
        {
            TryDeletePhoto(storedFileName);
            throw;
        }

        if (!string.IsNullOrWhiteSpace(previousFileName))
        {
            TryDeletePhoto(previousFileName);
        }

        return Ok(await CreateResponseAsync(
            user,
            cancellationToken));
    }

    [HttpDelete("photo")]
    public async Task<IActionResult> DeletePhoto()
    {
        var user = await GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        var previousFileName = user.ProfilePhotoFileName;

        if (string.IsNullOrWhiteSpace(previousFileName))
        {
            return NoContent();
        }

        user.ProfilePhotoFileName = null;
        var updateResult = await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            user.ProfilePhotoFileName = previousFileName;

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "The profile photo could not be removed."
                });
        }

        TryDeletePhoto(previousFileName);

        return NoContent();
    }

    [HttpGet("photo")]
    public async Task<IActionResult> GetPhoto(
        CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        if (string.IsNullOrWhiteSpace(user.ProfilePhotoFileName))
        {
            return NotFound(new
            {
                message = "No profile photo is available."
            });
        }

        var photoPath = GetSafePhotoPath(
            user.ProfilePhotoFileName);
        var extension = Path.GetExtension(
            user.ProfilePhotoFileName);

        if (photoPath is null ||
            !AllowedImageTypes.TryGetValue(
                extension,
                out var contentType) ||
            !System.IO.File.Exists(photoPath))
        {
            return NotFound(new
            {
                message = "No profile photo is available."
            });
        }

        var photoBytes = await System.IO.File.ReadAllBytesAsync(
            photoPath,
            cancellationToken);

        Response.Headers.CacheControl = "no-store";
        return File(photoBytes, contentType);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

        var securityStampBeforeChange =
            await _userManager.GetSecurityStampAsync(user);

        var changeResult = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);

        if (!changeResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);

            var currentPasswordIsWrong =
                changeResult.Errors.Any(error =>
                    string.Equals(
                        error.Code,
                        "PasswordMismatch",
                        StringComparison.Ordinal));

            if (currentPasswordIsWrong)
            {
                return BadRequest(new
                {
                    message = "The current password is incorrect."
                });
            }

            return BadRequest(new
            {
                message = "The password could not be changed.",
                errors = changeResult.Errors.Select(error => new
                {
                    code = error.Code,
                    description = error.Description
                })
            });
        }

        var securityStampAfterChange =
            await _userManager.GetSecurityStampAsync(user);

        if (string.Equals(
                securityStampBeforeChange,
                securityStampAfterChange,
                StringComparison.Ordinal))
        {
            var stampResult =
                await _userManager.UpdateSecurityStampAsync(user);

            if (!stampResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);

                _logger.LogError(
                    "Password changed for user {UserId}, but the Identity security stamp could not be rotated. Error codes: {ErrorCodes}",
                    user.Id,
                    stampResult.Errors
                        .Select(error => error.Code)
                        .ToArray());

                return Problem(
                    detail:
                        "The password could not be changed securely.",
                    statusCode:
                        StatusCodes.Status500InternalServerError);
            }
        }

        await transaction.CommitAsync(cancellationToken);

        return Ok(new
        {
            message = "Password changed successfully."
        });
    }

    private async Task<ApplicationUser?> GetCurrentUserAsync()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return null;
        }

        var user = await _userManager.FindByIdAsync(
            userId.ToString());

        return user is { IsActive: true }
            ? user
            : null;
    }

    private async Task<ProfileResponse> CreateResponseAsync(
        ApplicationUser user,
        CancellationToken cancellationToken)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var departmentName = user.DepartmentId.HasValue
            ? await _dbContext.Departments
                .AsNoTracking()
                .Where(department =>
                    department.Id == user.DepartmentId.Value)
                .Select(department => department.DepartmentName)
                .SingleOrDefaultAsync(cancellationToken)
            : null;

        return new ProfileResponse
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName =
                $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            DepartmentId = user.DepartmentId,
            DepartmentName = departmentName,
            Roles = roles.ToArray(),
            IsActive = user.IsActive,
            CreatedDate = user.CreatedDate,
            HasProfilePhoto =
                !string.IsNullOrWhiteSpace(
                    user.ProfilePhotoFileName)
        };
    }

    private static async Task<PhotoValidationResult>
        ValidatePhotoAsync(
            IFormFile? photo,
            CancellationToken cancellationToken)
    {
        const string invalidMessage =
            "Please upload a valid JPG, PNG, or WEBP image.";

        if (photo is null || photo.Length <= 0)
        {
            return PhotoValidationResult.Failure(invalidMessage);
        }

        if (photo.Length > MaxPhotoSizeBytes)
        {
            return PhotoValidationResult.Failure(
                "Profile photos must not exceed 2 MB.");
        }

        var extension = Path.GetExtension(photo.FileName)
            .ToLowerInvariant();

        if (!AllowedImageTypes.TryGetValue(
                extension,
                out var expectedContentType) ||
            !string.Equals(
                photo.ContentType,
                expectedContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            return PhotoValidationResult.Failure(invalidMessage);
        }

        var signature = new byte[12];
        await using var stream = photo.OpenReadStream();
        var bytesRead = await stream.ReadAsync(
            signature.AsMemory(0, signature.Length),
            cancellationToken);

        var hasValidSignature = extension switch
        {
            ".png" => bytesRead >= 8 &&
                signature.AsSpan(0, 8).SequenceEqual(
                    new byte[]
                    {
                        0x89, 0x50, 0x4E, 0x47,
                        0x0D, 0x0A, 0x1A, 0x0A
                    }),
            ".jpg" or ".jpeg" => bytesRead >= 3 &&
                signature[0] == 0xFF &&
                signature[1] == 0xD8 &&
                signature[2] == 0xFF,
            ".webp" => bytesRead >= 12 &&
                signature.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                signature.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };

        return hasValidSignature
            ? PhotoValidationResult.Success(extension)
            : PhotoValidationResult.Failure(invalidMessage);
    }

    private string? GetSafePhotoPath(string fileName)
    {
        if (!string.Equals(
                fileName,
                Path.GetFileName(fileName),
                StringComparison.Ordinal))
        {
            return null;
        }

        try
        {
            var fullPath = Path.GetFullPath(
                Path.Combine(_photoStoragePath, fileName));
            var normalizedRoot = _photoStoragePath.TrimEnd(
                    Path.DirectorySeparatorChar,
                    Path.AltDirectorySeparatorChar)
                + Path.DirectorySeparatorChar;
            var comparison = OperatingSystem.IsWindows()
                ? StringComparison.OrdinalIgnoreCase
                : StringComparison.Ordinal;

            return fullPath.StartsWith(normalizedRoot, comparison)
                ? fullPath
                : null;
        }
        catch (Exception exception)
            when (exception is ArgumentException
                or IOException
                or NotSupportedException)
        {
            return null;
        }
    }

    private void TryDeletePhoto(string fileName)
    {
        var photoPath = GetSafePhotoPath(fileName);

        if (photoPath is null)
        {
            _logger.LogWarning(
                "An unsafe stored profile photo name was rejected for cleanup.");
            return;
        }

        try
        {
            if (System.IO.File.Exists(photoPath))
            {
                System.IO.File.Delete(photoPath);
            }
        }
        catch (Exception exception)
            when (exception is IOException
                or UnauthorizedAccessException)
        {
            _logger.LogWarning(
                exception,
                "Unable to delete stored profile photo {StoredFileName}.",
                fileName);
        }
    }

    private sealed record PhotoValidationResult(
        bool IsValid,
        string Extension,
        string ErrorMessage)
    {
        public static PhotoValidationResult Success(
            string extension) => new(true, extension, string.Empty);

        public static PhotoValidationResult Failure(
            string message) => new(false, string.Empty, message);
    }
}
