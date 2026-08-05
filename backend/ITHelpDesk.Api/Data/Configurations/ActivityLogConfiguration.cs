using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class ActivityLogConfiguration
    : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("ActivityLogs");

        builder.HasKey(log => log.Id);

        builder.Property(log => log.ActivityType)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(log => log.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(log => log.EntityType)
            .HasMaxLength(80);

        builder.Property(log => log.IpAddress)
            .HasMaxLength(45);

        builder.Property(log => log.CreatedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(log => log.UserAccount)
            .WithMany(user => user.ActivityLogs)
            .HasForeignKey(log => log.UserAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(log => log.Ticket)
            .WithMany(ticket => ticket.ActivityLogs)
            .HasForeignKey(log => log.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(log => log.UserAccountId);
        builder.HasIndex(log => log.TicketId);
        builder.HasIndex(log => log.ActivityType);
        builder.HasIndex(log => log.CreatedDate);
    }
}
