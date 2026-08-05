using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class TicketAssignmentConfiguration
    : IEntityTypeConfiguration<TicketAssignment>
{
    public void Configure(EntityTypeBuilder<TicketAssignment> builder)
    {
        builder.ToTable("TicketAssignments");

        builder.HasKey(assignment => assignment.Id);

        builder.Property(assignment => assignment.AssignmentReason)
            .HasMaxLength(255);

        builder.Property(assignment => assignment.IsEscalation)
            .HasDefaultValue(false);

        builder.Property(assignment => assignment.AssignedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(assignment => assignment.UnassignedDate)
            .HasColumnType("datetime2");

        builder.HasOne(assignment => assignment.Ticket)
            .WithMany(ticket => ticket.Assignments)
            .HasForeignKey(assignment => assignment.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(assignment => assignment.AssignedToUserAccount)
            .WithMany(user => user.TicketAssignmentsReceived)
            .HasForeignKey(assignment =>
                assignment.AssignedToUserAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(assignment => assignment.AssignedByUserAccount)
            .WithMany(user => user.TicketAssignmentsMade)
            .HasForeignKey(assignment =>
                assignment.AssignedByUserAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(assignment => assignment.TicketId);

        builder.HasIndex(assignment => new
        {
            assignment.AssignedToUserAccountId,
            assignment.UnassignedDate
        });

        // A ticket can have only one active assignment.
        builder.HasIndex(assignment => assignment.TicketId)
            .HasFilter("[UnassignedDate] IS NULL")
            .IsUnique();

        // Hide assignment history when its ticket is soft-deleted.
        builder.HasQueryFilter(
            assignment => !assignment.Ticket.IsDeleted);
    }
}
