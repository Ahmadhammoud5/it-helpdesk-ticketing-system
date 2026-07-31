using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class TicketHistoryConfiguration
    : IEntityTypeConfiguration<TicketHistory>
{
    public void Configure(EntityTypeBuilder<TicketHistory> builder)
    {
        builder.ToTable("TicketHistory");

        builder.HasKey(history => history.Id);

        builder.Property(history => history.FieldName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(history => history.OldValue)
            .HasColumnType("nvarchar(max)");

        builder.Property(history => history.NewValue)
            .HasColumnType("nvarchar(max)");

        builder.Property(history => history.ChangedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(history => history.Ticket)
            .WithMany(ticket => ticket.History)
            .HasForeignKey(history => history.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(history => history.ChangedByUserAccount)
            .WithMany(user => user.TicketHistoryChanges)
            .HasForeignKey(history =>
                history.ChangedByUserAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(history => new
        {
            history.TicketId,
            history.ChangedDate
        });

        builder.HasIndex(history =>
            history.ChangedByUserAccountId);

        // Hide ticket history when its ticket is soft-deleted.
        builder.HasQueryFilter(
            history => !history.Ticket.IsDeleted);
    }
}
