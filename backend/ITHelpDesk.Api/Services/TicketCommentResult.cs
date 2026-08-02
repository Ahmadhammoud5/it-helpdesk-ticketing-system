namespace ITHelpDesk.Api.Services;

public enum TicketCommentError
{
    None,
    TicketNotFound,
    CommentNotFound,
    Forbidden,
    EmptyComment,
    CommentTooLong,
    InternalCommentForbidden,
    TicketIsFinal
}

public sealed class TicketCommentResult<T>
{
    public bool Succeeded { get; }

    public T? Value { get; }

    public TicketCommentError Error { get; }

    private TicketCommentResult(
        bool succeeded,
        T? value,
        TicketCommentError error)
    {
        Succeeded = succeeded;
        Value = value;
        Error = error;
    }

    public static TicketCommentResult<T> Success(
        T value)
        => new(true, value, TicketCommentError.None);

    public static TicketCommentResult<T> Failure(
        TicketCommentError error)
        => new(false, default, error);
}