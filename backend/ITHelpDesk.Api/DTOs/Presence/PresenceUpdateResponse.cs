namespace ITHelpDesk.Api.DTOs.Presence;

public sealed class PresenceUpdateResponse
{
    public int UserId { get; set; }

    public bool IsOnline { get; set; }

    public DateTime? LastSeenUtc { get; set; }
}
