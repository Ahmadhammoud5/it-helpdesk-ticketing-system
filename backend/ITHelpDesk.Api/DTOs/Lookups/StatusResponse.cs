namespace ITHelpDesk.Api.DTOs.Lookups;

public class StatusResponse
{
    public int Id { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsFinal { get; set; }
}