namespace ITHelpDesk.Api.DTOs.Tickets;

public class TicketAttachmentResponse
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public int UploadedByUserId { get; set; }

    public string UploadedByName { get; set; } = string.Empty;

    public DateTime CreatedDate { get; set; }
}