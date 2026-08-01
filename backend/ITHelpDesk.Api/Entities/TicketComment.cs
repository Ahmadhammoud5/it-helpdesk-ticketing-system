namespace ITHelpDesk.Api.Entities;

public class TicketComment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public Ticket Ticket { get; set; } = null!;

    public int UserAccountId { get; set; }

    public ApplicationUser UserAccount { get; set; } = null!;

    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? UpdatedDate { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedDate { get; set; }

    public int? DeletedByUserAccountId { get; set; }

    public ApplicationUser? DeletedByUserAccount { get; set; }
}
