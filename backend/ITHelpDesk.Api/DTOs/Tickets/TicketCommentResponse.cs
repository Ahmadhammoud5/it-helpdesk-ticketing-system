namespace ITHelpDesk.Api.DTOs.Tickets;

public class TicketCommentResponse
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public int UserAccountId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? UpdatedDate { get; set; }

    public bool CanEdit { get; set; }

    public bool CanDelete { get; set; }
}