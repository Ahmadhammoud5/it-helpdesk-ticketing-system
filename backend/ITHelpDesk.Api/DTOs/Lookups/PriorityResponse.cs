namespace ITHelpDesk.Api.DTOs.Lookups;

public class PriorityResponse
{
    public int Id { get; set; }

    public string PriorityName { get; set; } = string.Empty;

    public int PriorityRank { get; set; }

    public string ColorCode { get; set; } = string.Empty;
}