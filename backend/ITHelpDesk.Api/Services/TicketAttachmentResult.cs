namespace ITHelpDesk.Api.Services;

public enum TicketAttachmentError
{
    None = 0,
    TicketNotFound,
    AttachmentNotFound,
    Forbidden,
    TicketIsFinal,
    ResolvedIsReadOnly,
    NoFiles,
    TooManyFiles,
    FileTooLarge,
    TicketStorageLimitExceeded,
    UnsupportedFileType,
    InvalidFileName,
    FileNotFoundOnDisk
}

public sealed class TicketAttachmentResult<T>
{
    private TicketAttachmentResult(
        bool succeeded,
        T? value,
        TicketAttachmentError error)
    {
        Succeeded = succeeded;
        Value = value;
        Error = error;
    }

    public bool Succeeded { get; }

    public T? Value { get; }

    public TicketAttachmentError Error { get; }

    public static TicketAttachmentResult<T> Success(T value)
    {
        return new TicketAttachmentResult<T>(
            true,
            value,
            TicketAttachmentError.None);
    }

    public static TicketAttachmentResult<T> Failure(
        TicketAttachmentError error)
    {
        return new TicketAttachmentResult<T>(
            false,
            default,
            error);
    }
}
