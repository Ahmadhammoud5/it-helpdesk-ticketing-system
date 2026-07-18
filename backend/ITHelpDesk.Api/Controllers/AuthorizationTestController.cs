using ITHelpDesk.Api.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/test")]
public class AuthorizationTestController : ControllerBase
{
    [Authorize]
    [HttpGet("authenticated")]
    public IActionResult Authenticated()
    {
        return Ok(new
        {
            message = "Valid token. Authentication succeeded.",
            user = User.Identity?.Name
        });
    }

    [Authorize(Roles = SystemRoles.Admin)]
    [HttpGet("admin")]
    public IActionResult AdminOnly()
    {
        return Ok(new
        {
            message = "Admin privilege confirmed."
        });
    }

    [Authorize(
        Roles = SystemRoles.Admin + "," +
                SystemRoles.ITSupportAgent)]
    [HttpGet("support")]
    public IActionResult SupportTeam()
    {
        return Ok(new
        {
            message = "Support-team privilege confirmed."
        });
    }

    [Authorize(
        Roles = SystemRoles.Admin + "," +
                SystemRoles.Manager)]
    [HttpGet("manager")]
    public IActionResult ManagerAccess()
    {
        return Ok(new
        {
            message = "Management privilege confirmed."
        });
    }
}