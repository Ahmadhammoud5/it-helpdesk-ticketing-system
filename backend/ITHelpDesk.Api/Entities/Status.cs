namespace ITHelpDesk.Api.Entities;

public class Status
{
    public int Id { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsFinal { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}