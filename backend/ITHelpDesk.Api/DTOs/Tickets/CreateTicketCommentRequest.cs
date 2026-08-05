namespace ITHelpDesk.Api.DTOs.Tickets;

public class CreateTicketCommentRequest
{
    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; }
}