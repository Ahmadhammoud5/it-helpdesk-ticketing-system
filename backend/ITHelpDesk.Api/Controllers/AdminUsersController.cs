using System.Security.Claims;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.DTOs.Admin;
using ITHelpDesk.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

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

        var currentAdminIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (int.TryParse(currentAdminIdValue, out var currentAdminId) &&
            currentAdminId == userId &&
            validRole != SystemRoles.Admin)
        {
            return BadRequest(new
            {
                message = "You cannot remove your own Admin role."
            });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);

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
                message = "The user already has this role."
            });
        }

        var alreadyHasRequestedRole = currentRoles.Contains(
            validRole,
            StringComparer.OrdinalIgnoreCase);

        if (!alreadyHasRequestedRole)
        {
            var addResult = await _userManager.AddToRoleAsync(
                user,
                validRole);

            if (!addResult.Succeeded)
            {
                return BadRequest(new
                {
                    message = "The new role could not be assigned.",
                    errors = addResult.Errors.Select(error =>
                        error.Description)
                });
            }
        }

        var rolesToRemove = currentRoles
            .Where(role => !string.Equals(
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
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "The new role was assigned, but old roles could not be removed.",
                        errors = removeResult.Errors.Select(error =>
                            error.Description)
                    });
            }
        }

        return Ok(new
        {
            userId = user.Id,
            email = user.Email,
            previousRoles = currentRoles,
            role = validRole,
            message = "User role updated successfully."
        });
    }
}