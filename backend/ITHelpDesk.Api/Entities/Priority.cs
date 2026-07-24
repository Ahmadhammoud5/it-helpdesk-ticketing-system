namespace ITHelpDesk.Api.Entities;

public class Priority
{
    public int Id { get; set; }

    public string PriorityName { get; set; } = string.Empty;

    public int PriorityRank { get; set; }

    public string ColorCode { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}