namespace ITHelpDesk.Api.DTOs.Manager;

public sealed class ManagerTeamAgentResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public bool IsOnline { get; set; }

    public int AssignedTicketCount { get; set; }

    public int InProgressTicketCount { get; set; }

    public int PendingTicketCount { get; set; }
}
