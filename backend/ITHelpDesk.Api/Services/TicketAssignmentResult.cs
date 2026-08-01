namespace ITHelpDesk.Api.Services;

public enum TicketAssignmentError
{
    None,
    TicketNotFound,
    AgentNotFound,
    Forbidden,
    AgentInactive,
    UserIsNotSupportAgent,
    TicketAlreadyAssignedToAgent,
    TicketNotAssigned,
    TicketIsFinal
}

public sealed class TicketAssignmentResult<T>
{
    public bool Succeeded { get; }

    public T? Value { get; }

    public TicketAssignmentError Error { get; }

    private TicketAssignmentResult(
        bool succeeded,
        T? value,
        TicketAssignmentError error)
    {
        Succeeded = succeeded;
        Value = value;
        Error = error;
    }

    public static TicketAssignmentResult<T> Success(
        T value)
        => new(true, value, TicketAssignmentError.None);

    public static TicketAssignmentResult<T> Failure(
        TicketAssignmentError error)
        => new(false, default, error);
}