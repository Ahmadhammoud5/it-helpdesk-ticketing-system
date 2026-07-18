using ITHelpDesk.Api.Constants;
using Microsoft.AspNetCore.Identity;
using ITHelpDesk.Api.Entities;
using Microsoft.Extensions.Configuration;
namespace ITHelpDesk.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedRolesAsync(
        RoleManager<IdentityRole<int>> roleManager)
    {
        foreach (var roleName in SystemRoles.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(
                new IdentityRole<int>
                {
                    Name = roleName
                });

            if (!result.Succeeded)
            {
                var errors = string.Join(
                    "; ",
                    result.Errors.Select(error => error.Description));

                throw new InvalidOperationException(
                    $"Failed to create role '{roleName}': {errors}");
            }
        }
    }
    public static async Task SeedAdminAsync(
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration)
    {
        var email = configuration["SeedAdmin:Email"];
        var password = configuration["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        email = email.Trim().ToLowerInvariant();

        var adminUser = await userManager.FindByEmailAsync(email);

        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                FirstName = "System",
                LastName = "Administrator",
                Email = email,
                UserName = email,
                EmailConfirmed = true,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(
                adminUser,
                password);

            if (!createResult.Succeeded)
            {
                var errors = string.Join(
                    "; ",
                    createResult.Errors.Select(error =>
                        error.Description));

                throw new InvalidOperationException(
                    $"Failed to create Admin account: {errors}");
            }
        }

        if (!await userManager.IsInRoleAsync(
                adminUser,
                SystemRoles.Admin))
        {
            var roleResult = await userManager.AddToRoleAsync(
                adminUser,
                SystemRoles.Admin);

            if (!roleResult.Succeeded)
            {
                var errors = string.Join(
                    "; ",
                    roleResult.Errors.Select(error =>
                        error.Description));

                throw new InvalidOperationException(
                    $"Failed to assign Admin role: {errors}");
            }
        }
    }
}