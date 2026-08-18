using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.DTOs.Manager;
using ITHelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.Api.Controllers;

[ApiController]
[Route("api/manager/team")]
[Authorize(Roles = SystemRoles.Manager)]
public sealed class ManagerTeamController : ControllerBase
{
    private readonly IManagerTeamService _managerTeamService;

    public ManagerTeamController(
        IManagerTeamService managerTeamService)
    {
        _managerTeamService = managerTeamService;
    }

    [HttpGet]
    public async Task<ActionResult<ManagerTeamResponse>> GetTeam(
        CancellationToken cancellationToken)
    {
        return Ok(await _managerTeamService.GetTeamAsync(
            cancellationToken));
    }
}
