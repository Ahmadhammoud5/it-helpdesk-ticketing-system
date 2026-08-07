namespace ITHelpDesk.Api.Options;

public class TicketAttachmentOptions
{
    public const string SectionName = "TicketAttachments";

    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

    public int MaxFilesPerUpload { get; set; } = 5;

    public long MaxTotalSizePerTicketBytes { get; set; } = 50 * 1024 * 1024;

    public string StorageRoot { get; set; } = "Uploads/TicketAttachments";

    public string[] AllowedExtensions { get; set; } =
    [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".pdf",
        ".txt",
        ".docx",
        ".xlsx"
    ];
}