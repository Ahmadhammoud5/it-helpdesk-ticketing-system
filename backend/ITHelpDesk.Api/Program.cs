using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using ITHelpDesk.Api.Options;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "The database connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole<int>>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;

        options.User.RequireUniqueEmail = true;

        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan =
            TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
var jwtSection = builder.Configuration
    .GetSection(JwtOptions.SectionName);

builder.Services.Configure<JwtOptions>(jwtSection);

var jwtOptions = jwtSection.Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "JWT configuration is missing.");

if (string.IsNullOrWhiteSpace(jwtOptions.Issuer))
{
    throw new InvalidOperationException(
        "JWT issuer is missing.");
}

if (string.IsNullOrWhiteSpace(jwtOptions.Audience))
{
    throw new InvalidOperationException(
        "JWT audience is missing.");
}

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    throw new InvalidOperationException(
        "JWT signing key is missing.");
}

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtOptions.Key)),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider
        .GetRequiredService<RoleManager<IdentityRole<int>>>();

    var userManager = scope.ServiceProvider
        .GetRequiredService<UserManager<ApplicationUser>>();

    await DatabaseSeeder.SeedRolesAsync(roleManager);

    if (app.Environment.IsDevelopment())
    {
        await DatabaseSeeder.SeedAdminAsync(
            userManager,
            app.Configuration);
    }
}
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();