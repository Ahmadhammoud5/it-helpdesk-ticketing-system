namespace ITHelpDesk.Api.DTOs.Reports;

public sealed class ReportVolumeItemResponse
{
    public DateOnly Date { get; set; }

    public int Count { get; set; }
}
