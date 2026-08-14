using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Admin;
using ITHelpDesk.Api.Entities;
using ITHelpDesk.Api.Services;
using ITHelpDesk.Api.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = SystemRoles.Admin)]
public class AdminUsersController : ControllerBase
{
    private static readonly SemaphoreSlim AdminMutationLock =
        new(1, 1);

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly IPresenceService _presenceService;

    public AdminUsersController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        IPresenceService presenceService)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _presenceService = presenceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(user => user.FirstName)
            .ThenBy(user => user.LastName)
            .ThenBy(user => user.Email)
            .ToListAsync(cancellationToken);

        var userRoles = await (
                from userRole in _dbContext.UserRoles.AsNoTracking()
                join role in _dbContext.Roles.AsNoTracking()
                    on userRole.RoleId equals role.Id
                select new
                {
                    userRole.UserId,
                    Role = role.Name!
                })
            .ToListAsync(cancellationToken);

        var rolesByUserId = userRoles
            .GroupBy(item => item.UserId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(item => item.Role)
                    .OrderBy(role => role)
                    .ToArray());

        var response = users
            .Select(user => new AdminUserResponse
            {
                UserId = user.Id,
                FullName =
                    $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                IsActive = user.IsActive,
                IsOnline = user.IsActive &&
                    _presenceService.IsOnline(user.Id),
                LastSeenUtc = UtcDateTime.Normalize(user.LastSeenUtc),
                Roles = rolesByUserId.GetValueOrDefault(user.Id) ?? []
            })
            .ToList();

        return Ok(response);
    }

    [HttpPut("{userId:int}/status")]
    public async Task<IActionResult> UpdateUserStatus(
        int userId,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        var requestedIsActive = request.IsActive!.Value;
        DateTime? lastSeenUtc = null;
        ApplicationUser? user;

        await AdminMutationLock.WaitAsync(cancellationToken);

        try
        {
            user = await _userManager.FindByIdAsync(
                userId.ToString());

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var currentAdminIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!requestedIsActive &&
                int.TryParse(currentAdminIdValue, out var currentAdminId) &&
                currentAdminId == userId)
            {
                return BadRequest(new
                {
                    message =
                        "You cannot deactivate your own account."
                });
            }

            if (user.IsActive == requestedIsActive)
            {
                return Ok(new
                {
                    userId = user.Id,
                    isActive = user.IsActive,
                    lastSeenUtc = UtcDateTime.Normalize(user.LastSeenUtc),
                    message = requestedIsActive
                        ? "The account is already active."
                        : "The account is already inactive."
                });
            }

            if (!requestedIsActive &&
                await _userManager.IsInRoleAsync(
                    user,
                    SystemRoles.Admin))
            {
                var administrators =
                    await _userManager.GetUsersInRoleAsync(
                        SystemRoles.Admin);

                var anotherActiveAdministratorExists =
                    administrators.Any(administrator =>
                        administrator.Id != userId &&
                        administrator.IsActive);

                if (!anotherActiveAdministratorExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "At least one active Admin account must remain."
                    });
                }
            }

            user.IsActive = requestedIsActive;

            if (!requestedIsActive)
            {
                lastSeenUtc = DateTime.UtcNow;
                user.LastSeenUtc = lastSeenUtc;
            }

            var updateResult = await _userManager.UpdateAsync(user);

            if (!updateResult.Succeeded)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "The account status could not be updated.",
                        errors = updateResult.Errors.Select(
                            error => error.Description)
                    });
            }
        }
        finally
        {
            AdminMutationLock.Release();
        }

        if (!requestedIsActive)
        {
            await _presenceService.DisconnectUserAsync(
                userId,
                "accountDeactivated",
                lastSeenUtc!.Value,
                CancellationToken.None);
        }

        return Ok(new
        {
            userId,
            isActive = requestedIsActive,
            isOnline = false,
            lastSeenUtc = UtcDateTime.Normalize(user.LastSeenUtc),
            message = requestedIsActive
                ? "User account reactivated successfully."
                : "User account deactivated successfully."
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser(
        CreateAdminUserRequest request)
    {
        var requestedRole =
            request.Role.Trim();

        var validRole =
            SystemRoles.All.FirstOrDefault(role =>
                string.Equals(
                    role,
                    requestedRole,
                    StringComparison.OrdinalIgnoreCase));

        if (validRole is null)
        {
            return BadRequest(new
            {
                message = "Invalid role.",
                allowedRoles = SystemRoles.All
            });
        }

        var normalizedEmail =
            request.Email.Trim().ToLowerInvariant();

        var existingUser =
            await _userManager.FindByEmailAsync(
                normalizedEmail);

        if (existingUser is not null)
        {
            return BadRequest(new
            {
                message =
                    "A user with this email already exists."
            });
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            IsActive = true,
            EmailConfirmed = true,
            CreatedDate = DateTime.UtcNow
        };

        var createResult =
            await _userManager.CreateAsync(
                user,
                request.Password);

        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                message =
                    "The user could not be created.",
                errors =
                    createResult.Errors.Select(
                        error => error.Description)
            });
        }

        var roleResult =
            await _userManager.AddToRoleAsync(
                user,
                validRole);

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);

            return BadRequest(new
            {
                message =
                    "The user was created, but the role could not be assigned.",
                errors =
                    roleResult.Errors.Select(
                        error => error.Description)
            });
        }

        return CreatedAtAction(
            nameof(GetUsers),
            new
            {
                userId = user.Id
            },
            new
            {
                userId = user.Id,
                fullName =
                    $"{user.FirstName} {user.LastName}",
                email = user.Email,
                role = validRole,
                isActive = user.IsActive
            });
    }

    [HttpPut("{userId:int}/role")]
    public async Task<IActionResult> UpdateUserRole(
        int userId,
        UpdateUserRoleRequest request,
        CancellationToken cancellationToken)
    {
        var requestedRole = request.Role.Trim();

        var validRole = SystemRoles.All.FirstOrDefault(role =>
            string.Equals(
                role,
                requestedRole,
                StringComparison.OrdinalIgnoreCase));

        if (validRole is null)
        {
            return BadRequest(new
            {
                message = "Invalid role.",
                allowedRoles = SystemRoles.All
            });
        }

        await AdminMutationLock.WaitAsync(cancellationToken);

        try
        {
            return await UpdateUserRoleCoreAsync(
                userId,
                validRole,
                cancellationToken);
        }
        finally
        {
            AdminMutationLock.Release();
        }
    }

    private async Task<IActionResult> UpdateUserRoleCoreAsync(
        int userId,
        string validRole,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(
            userId.ToString());

        if (user is null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var currentAdminIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (int.TryParse(
                currentAdminIdValue,
                out var currentAdminId) &&
            currentAdminId == userId &&
            validRole != SystemRoles.Admin)
        {
            return BadRequest(new
            {
                message =
                    "You cannot remove your own Admin role."
            });
        }

        var currentRoles =
            await _userManager.GetRolesAsync(user);

        if (currentRoles.Contains(
                SystemRoles.Admin,
                StringComparer.OrdinalIgnoreCase) &&
            validRole != SystemRoles.Admin)
        {
            var administrators =
                await _userManager.GetUsersInRoleAsync(
                    SystemRoles.Admin);

            var anotherActiveAdministratorExists =
                administrators.Any(administrator =>
                    administrator.Id != userId &&
                    administrator.IsActive);

            if (!anotherActiveAdministratorExists)
            {
                return BadRequest(new
                {
                    message =
                        "At least one active Admin account must remain."
                });
            }
        }

        if (currentRoles.Count == 1 &&
            currentRoles.Contains(
                validRole,
                StringComparer.OrdinalIgnoreCase))
        {
            return Ok(new
            {
                userId = user.Id,
                email = user.Email,
                role = validRole,
                message =
                    "The user already has this role."
            });
        }

        var alreadyHasRequestedRole =
            currentRoles.Contains(
                validRole,
                StringComparer.OrdinalIgnoreCase);

        if (!alreadyHasRequestedRole)
        {
            var addResult =
                await _userManager.AddToRoleAsync(
                    user,
                    validRole);

            if (!addResult.Succeeded)
            {
                return BadRequest(new
                {
                    message =
                        "The new role could not be assigned.",
                    errors =
                        addResult.Errors.Select(
                            error => error.Description)
                });
            }
        }

        var rolesToRemove =
            currentRoles
                .Where(role =>
                    !string.Equals(
                        role,
                        validRole,
                        StringComparison.OrdinalIgnoreCase))
                .ToArray();

        if (rolesToRemove.Length > 0)
        {
            var removeResult =
                await _userManager.RemoveFromRolesAsync(
                    user,
                    rolesToRemove);

            if (!removeResult.Succeeded)
            {
                if (!alreadyHasRequestedRole)
                {
                    await _userManager.RemoveFromRoleAsync(
                        user,
                        validRole);
                }

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "The new role was assigned, but old roles could not be removed.",
                        errors =
                            removeResult.Errors.Select(
                                error => error.Description)
                    });
            }
        }

        if (_presenceService.IsOnline(userId))
        {
            var lastSeenUtc = DateTime.UtcNow;

            await _dbContext.Users
                .Where(account => account.Id == userId)
                .ExecuteUpdateAsync(
                    updates => updates.SetProperty(
                        account => account.LastSeenUtc,
                        lastSeenUtc),
                    cancellationToken);

            await _presenceService.DisconnectUserAsync(
                userId,
                "sessionInvalidated",
                lastSeenUtc,
                CancellationToken.None);
        }

        return Ok(new
        {
            userId = user.Id,
            email = user.Email,
            previousRoles = currentRoles,
            role = validRole,
            message =
                "User role updated successfully."
        });
    }
}
