namespace ITHelpDesk.Api.DTOs.Tickets;

public class SupportAgentResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public bool IsOnline { get; set; }

    public DateTime? LastSeenUtc { get; set; }
}
