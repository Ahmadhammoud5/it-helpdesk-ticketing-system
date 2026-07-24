using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("Tickets");

        builder.HasKey(ticket => ticket.Id);

        builder.Property(ticket => ticket.ReferenceNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(ticket => ticket.ReferenceNumber)
            .IsUnique();

        builder.Property(ticket => ticket.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(ticket => ticket.Description)
            .HasMaxLength(5000)
            .IsRequired();

        builder.Property(ticket => ticket.CreatedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(ticket => ticket.LastUpdatedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(ticket => ticket.DueDate)
            .HasColumnType("datetime2");

        builder.Property(ticket => ticket.ResolvedDate)
            .HasColumnType("datetime2");

        builder.Property(ticket => ticket.ClosedDate)
            .HasColumnType("datetime2");

        builder.Property(ticket => ticket.IsDeleted)
            .HasDefaultValue(false);

        // Seeded Open status has ID 1.
        builder.Property(ticket => ticket.StatusId)
            .HasDefaultValue(1);

        builder.HasOne(ticket => ticket.Category)
            .WithMany(category => category.Tickets)
            .HasForeignKey(ticket => ticket.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ticket => ticket.Priority)
            .WithMany(priority => priority.Tickets)
            .HasForeignKey(ticket => ticket.PriorityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ticket => ticket.Status)
            .WithMany(status => status.Tickets)
            .HasForeignKey(ticket => ticket.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ticket => ticket.CreatedByUser)
            .WithMany(user => user.CreatedTickets)
            .HasForeignKey(ticket => ticket.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ticket => ticket.AssignedToUser)
            .WithMany(user => user.AssignedTickets)
            .HasForeignKey(ticket => ticket.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Useful indexes for filtering and future dashboard queries.
        builder.HasIndex(ticket => ticket.CategoryId);
        builder.HasIndex(ticket => ticket.PriorityId);
        builder.HasIndex(ticket => ticket.StatusId);
        builder.HasIndex(ticket => ticket.CreatedByUserId);
        builder.HasIndex(ticket => ticket.AssignedToUserId);
        builder.HasIndex(ticket => ticket.CreatedDate);

        // Soft-deleted tickets are hidden from normal queries.
        builder.HasQueryFilter(ticket => !ticket.IsDeleted);
    }
}