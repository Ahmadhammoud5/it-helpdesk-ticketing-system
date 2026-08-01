namespace ITHelpDesk.Api.Services;

public enum TicketWorkflowError
{
    None,
    TicketNotFound,
    Forbidden,
    StatusNotFound,
    SameStatus,
    InvalidStatusTransition,
    CancellationReasonRequired
}

public sealed class TicketWorkflowResult<T>
    where T : class
{
    public bool Succeeded =>
        Error == TicketWorkflowError.None;

    public TicketWorkflowError Error { get; private init; }

    public T? Value { get; private init; }

    public static TicketWorkflowResult<T> Success(T value)
    {
        return new TicketWorkflowResult<T>
        {
            Error = TicketWorkflowError.None,
            Value = value
        };
    }

    public static TicketWorkflowResult<T> Failure(
        TicketWorkflowError error)
    {
        return new TicketWorkflowResult<T>
        {
            Error = error
        };
    }
}
