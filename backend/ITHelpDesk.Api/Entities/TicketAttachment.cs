namespace ITHelpDesk.Api.Entities;

public class TicketAttachment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public Ticket Ticket { get; set; } = null!;

    public int UploadedByUserId { get; set; }

    public ApplicationUser UploadedByUser { get; set; } = null!;

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string StoragePath { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DateTime CreatedDate { get; set; }
}