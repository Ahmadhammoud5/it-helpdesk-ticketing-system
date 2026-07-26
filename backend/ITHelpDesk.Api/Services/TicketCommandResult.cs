using ITHelpDesk.Api.DTOs.Tickets;

namespace ITHelpDesk.Api.Services;

public enum TicketCommandError
{
    None,
    TicketNotFound,
    Forbidden,
    CategoryNotFound,
    PriorityNotFound
}

public sealed class TicketCommandResult
{
    public bool Succeeded => Error == TicketCommandError.None;

    public TicketCommandError Error { get; private init; }

    public TicketResponse? Ticket { get; private init; }

    public static TicketCommandResult Success(TicketResponse? ticket = null)
    {
        return new TicketCommandResult
        {
            Error = TicketCommandError.None,
            Ticket = ticket
        };
    }

    public static TicketCommandResult Failure(TicketCommandError error)
    {
        return new TicketCommandResult
        {
            Error = error
        };
    }
}