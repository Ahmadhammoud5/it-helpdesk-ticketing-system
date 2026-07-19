using System.Data;
using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Auth;
using ITHelpDesk.Api.Entities;
using ITHelpDesk.Api.Options;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly IPasswordResetCodeService _passwordResetCodeService;
    private readonly IEmailService _emailService;
    private readonly PasswordResetOptions _passwordResetOptions;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ApplicationDbContext dbContext,
        ITokenService tokenService,
        IPasswordResetCodeService passwordResetCodeService,
        IEmailService emailService,
        IOptions<PasswordResetOptions> passwordResetOptions,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _dbContext = dbContext;
        _tokenService = tokenService;
        _passwordResetCodeService = passwordResetCodeService;
        _emailService = emailService;
        _passwordResetOptions = passwordResetOptions.Value;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(
        RegisterRequest request)
    {
        var normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var existingUser = await _userManager.FindByEmailAsync(
            normalizedEmail);

        if (existingUser is not null)
        {
            return Conflict(new
            {
                message = "An account with this email already exists."
            });
        }

        if (request.DepartmentId.HasValue)
        {
            var departmentExists = await _dbContext.Departments
                .AnyAsync(department =>
                    department.Id == request.DepartmentId.Value &&
                    department.IsActive);

            if (!departmentExists)
            {
                return BadRequest(new
                {
                    message =
                        "The selected department does not exist or is inactive."
                });
            }
        }

        var user = new ApplicationUser
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            UserName = normalizedEmail,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
                ? null
                : request.PhoneNumber.Trim(),
            DepartmentId = request.DepartmentId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(
            user,
            request.Password);

        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                message = "Registration failed.",
                errors = createResult.Errors.Select(error =>
                    new
                    {
                        code = error.Code,
                        description = error.Description
                    })
            });
        }

        var roleResult = await _userManager.AddToRoleAsync(
            user,
            SystemRoles.Employee);

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "The account could not be assigned its default role."
                });
        }

        var response = new RegisterResponse
        {
            UserId = user.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            Email = user.Email!,
            Role = SystemRoles.Employee,
            Message = "Account created successfully."
        };

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        var normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var user = await _userManager.FindByEmailAsync(
            normalizedEmail);

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "This account is inactive."
            });
        }

        var signInResult =
            await _signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: true);

        if (signInResult.IsLockedOut)
        {
            return StatusCode(
                StatusCodes.Status423Locked,
                new
                {
                    message =
                        "The account is temporarily locked. Please try again later."
                });
        }

        if (!signInResult.Succeeded)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        user.LastLoginDate = DateTime.UtcNow;

        var updateResult = await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Login succeeded, but the account could not be updated."
                });
        }

        var tokenResult = _tokenService.CreateAccessToken(
            user,
            roles.ToArray());

        return Ok(new LoginResponse
        {
            AccessToken = tokenResult.AccessToken,
            ExpiresAtUtc = tokenResult.ExpiresAtUtc,
            UserId = user.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            Email = user.Email!,
            Roles = roles.ToArray()
        });
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        const string responseMessage =
            "If an account exists for this email, a reset code has been sent.";

        var normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var user = await _userManager.FindByEmailAsync(
            normalizedEmail);

        // Always return the same response so registered emails
        // cannot be discovered by attackers.
        if (user is null || !user.IsActive)
        {
            return Ok(new
            {
                message = responseMessage
            });
        }

        var now = DateTime.UtcNow;

        // Invalidate all previous unused reset codes.
        var previousCodes = await _dbContext.PasswordResetCodes
            .Where(resetCode =>
                resetCode.UserId == user.Id &&
                resetCode.UsedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var previousCode in previousCodes)
        {
            previousCode.UsedAtUtc = now;
        }

        var code = _passwordResetCodeService.GenerateCode();

        var passwordResetCode = new PasswordResetCode
        {
            UserId = user.Id,
            CodeHash = _passwordResetCodeService.HashCode(code),
            ExpiresAtUtc = now.AddMinutes(
                _passwordResetOptions.ExpirationMinutes),
            FailedAttempts = 0,
            UsedAtUtc = null,
            CreatedAtUtc = now
        };

        _dbContext.PasswordResetCodes.Add(passwordResetCode);

        await _dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailService.SendPasswordResetCodeAsync(
                user.Email!,
                $"{user.FirstName} {user.LastName}",
                code,
                _passwordResetOptions.ExpirationMinutes,
                cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to send a password reset email for user {UserId}.",
                user.Id);

            // A code that was not emailed must not remain usable.
            passwordResetCode.UsedAtUtc = DateTime.UtcNow;

            try
            {
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception updateException)
            {
                _logger.LogError(
                    updateException,
                    "Failed to invalidate password reset code {ResetCodeId}.",
                    passwordResetCode.Id);
            }
        }

        return Ok(new
        {
            message = responseMessage
        });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        const string invalidCodeMessage =
            "The reset code is invalid or has expired.";

        var normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var user = await _userManager.FindByEmailAsync(
            normalizedEmail);

        if (user is null || !user.IsActive)
        {
            return BadRequest(new
            {
                message = invalidCodeMessage
            });
        }

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

        var now = DateTime.UtcNow;

        var resetCode = await _dbContext.PasswordResetCodes
            .Where(code =>
                code.UserId == user.Id &&
                code.UsedAtUtc == null)
            .OrderByDescending(code => code.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (resetCode is null)
        {
            await transaction.RollbackAsync(cancellationToken);

            return BadRequest(new
            {
                message = invalidCodeMessage
            });
        }

        // Reject and invalidate expired codes.
        if (resetCode.ExpiresAtUtc <= now)
        {
            resetCode.UsedAtUtc = now;

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return BadRequest(new
            {
                message = invalidCodeMessage
            });
        }

        // Reject codes that reached the failed-attempt limit.
        if (resetCode.FailedAttempts >=
            _passwordResetOptions.MaxFailedAttempts)
        {
            resetCode.UsedAtUtc = now;

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return BadRequest(new
            {
                message = invalidCodeMessage
            });
        }

        var codeIsValid =
            _passwordResetCodeService.VerifyCode(
                request.Code,
                resetCode.CodeHash);

        if (!codeIsValid)
        {
            resetCode.FailedAttempts++;

            if (resetCode.FailedAttempts >=
                _passwordResetOptions.MaxFailedAttempts)
            {
                resetCode.UsedAtUtc = now;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return BadRequest(new
            {
                message = invalidCodeMessage
            });
        }

        var identityToken =
            await _userManager.GeneratePasswordResetTokenAsync(user);

        var resetResult =
            await _userManager.ResetPasswordAsync(
                user,
                identityToken,
                request.NewPassword);

        if (!resetResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);

            return BadRequest(new
            {
                message = "The password could not be reset.",
                errors = resetResult.Errors.Select(error =>
                    new
                    {
                        code = error.Code,
                        description = error.Description
                    })
            });
        }

        // Mark this code and any other unused code as consumed.
        var activeCodes = await _dbContext.PasswordResetCodes
            .Where(code =>
                code.UserId == user.Id &&
                code.UsedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var activeCode in activeCodes)
        {
            activeCode.UsedAtUtc = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new
        {
            message = "Password reset successfully."
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new
            {
                message = "The access token is invalid."
            });
        }

        var user = await _userManager.FindByIdAsync(
            userId.ToString());

        if (user is null || !user.IsActive)
        {
            return Unauthorized(new
            {
                message = "The user account is unavailable."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            userId = user.Id,
            fullName = $"{user.FirstName} {user.LastName}",
            email = user.Email,
            departmentId = user.DepartmentId,
            roles
        });
    }
}