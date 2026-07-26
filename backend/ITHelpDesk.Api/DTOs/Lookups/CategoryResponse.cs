namespace ITHelpDesk.Api.DTOs.Lookups;

public class CategoryResponse
{
    public int Id { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}