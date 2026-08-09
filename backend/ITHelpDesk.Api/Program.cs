using System.Security.Claims;
using System.Text;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.Entities;
using ITHelpDesk.Api.Hubs;
using ITHelpDesk.Api.Options;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Password reset configuration
builder.Services
    .AddOptions<PasswordResetOptions>()
    .Bind(
        builder.Configuration.GetSection(
            PasswordResetOptions.SectionName))
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.HashKey),
        "PasswordReset:HashKey is missing.")
    .Validate(
        options => options.ExpirationMinutes > 0,
        "Password reset expiration must be greater than zero.")
    .Validate(
        options => options.MaxFailedAttempts > 0,
        "Maximum failed attempts must be greater than zero.")
    .ValidateOnStart();

// Email configuration
builder.Services
    .AddOptions<EmailOptions>()
    .Bind(
        builder.Configuration.GetSection(
            EmailOptions.SectionName))
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.SmtpHost),
        "Email:SmtpHost is missing.")
    .Validate(
        options => options.SmtpPort > 0,
        "Email:SmtpPort must be greater than zero.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.Username),
        "Email:Username is missing.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.Password),
        "Email:Password is missing.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.FromEmail),
        "Email:FromEmail is missing.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.FromName),
        "Email:FromName is missing.")
    .ValidateOnStart();

// Ticket attachment configuration
builder.Services
    .AddOptions<TicketAttachmentOptions>()
    .Bind(
        builder.Configuration.GetSection(
            TicketAttachmentOptions.SectionName))
    .Validate(
        options => options.MaxFileSizeBytes > 0,
        "Ticket attachment max file size must be greater than zero.")
    .Validate(
        options => options.MaxFilesPerUpload > 0,
        "Ticket attachment max files per upload must be greater than zero.")
    .Validate(
        options => options.MaxTotalSizePerTicketBytes > 0,
        "Ticket attachment max total size per ticket must be greater than zero.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.StorageRoot),
        "Ticket attachment storage root is missing.")
    .Validate(
        options => options.AllowedExtensions.Length > 0,
        "At least one ticket attachment extension must be allowed.")
    .ValidateOnStart();

// Database connection
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "The database connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// ASP.NET Core Identity
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

// JWT configuration
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

// Application services
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<
    IPasswordResetCodeService,
    PasswordResetCodeService>();

builder.Services.AddScoped<
    IEmailService,
    SmtpEmailService>();

builder.Services.AddScoped<
    ITicketCommandService,
    TicketCommandService>();

builder.Services.AddScoped<
    ITicketQueryService,
    TicketQueryService>();

builder.Services.AddScoped<
    ITicketWorkflowService,
    TicketWorkflowService>();

builder.Services.AddScoped<
    ITicketAssignmentService,
    TicketAssignmentService>();

builder.Services.AddScoped<
    ITicketCommentService,
    TicketCommentService>();

builder.Services.AddScoped<
    ITicketAttachmentService,
    TicketAttachmentService>();

builder.Services.AddScoped<
    IDashboardService,
    DashboardService>();

builder.Services.AddScoped<
    INotificationService,
    NotificationService>();

// JWT authentication
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

        // SignalR authentication.
        // The SignalR JavaScript client supplies its JWT
        // through the access_token query string when required.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken =
                    context.Request.Query["access_token"]
                        .ToString();

                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrWhiteSpace(accessToken) &&
                    path.StartsWithSegments(
                        "/hubs/notifications"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

var app = builder.Build();

// Seed roles and development administrator
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

// Development OpenAPI endpoint
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>(
    "/hubs/notifications");

app.Run();