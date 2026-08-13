using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.DTOs.Admin;
using ITHelpDesk.Api.Entities;
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
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminUsersController(
        UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .OrderBy(user => user.FirstName)
            .ThenBy(user => user.LastName)
            .ThenBy(user => user.Email)
            .ToListAsync(cancellationToken);

        var response = new List<object>();

        foreach (var user in users)
        {
            var roles =
                await _userManager.GetRolesAsync(user);

            response.Add(new
            {
                userId = user.Id,
                fullName =
                    $"{user.FirstName} {user.LastName}",
                email = user.Email,
                isActive = user.IsActive,
                roles
            });
        }

        return Ok(response);
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
        UpdateUserRoleRequest request)
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
