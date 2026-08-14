namespace ITHelpDesk.Api.DTOs.Manager;

public sealed class ManagerTeamResponse
{
    public int SupportAgentCount { get; set; }

    public int OnlineCount { get; set; }

    public int AssignedTicketCount { get; set; }

    public int UnassignedTicketCount { get; set; }

    public IReadOnlyList<ManagerTeamAgentResponse> Agents { get; set; }
        = [];
}
