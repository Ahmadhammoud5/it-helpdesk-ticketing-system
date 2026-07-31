using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class TicketCommentConfiguration
    : IEntityTypeConfiguration<TicketComment>
{
    public void Configure(EntityTypeBuilder<TicketComment> builder)
    {
        builder.ToTable("TicketComments");

        builder.HasKey(comment => comment.Id);

        builder.Property(comment => comment.CommentText)
            .HasMaxLength(5000)
            .IsRequired();

        builder.Property(comment => comment.IsInternal)
            .HasDefaultValue(false);

        builder.Property(comment => comment.CreatedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(comment => comment.UpdatedDate)
            .HasColumnType("datetime2");

        builder.Property(comment => comment.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(comment => comment.DeletedDate)
            .HasColumnType("datetime2");

        builder.HasOne(comment => comment.Ticket)
            .WithMany(ticket => ticket.Comments)
            .HasForeignKey(comment => comment.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(comment => comment.UserAccount)
            .WithMany(user => user.TicketComments)
            .HasForeignKey(comment => comment.UserAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(comment => comment.DeletedByUserAccount)
            .WithMany(user => user.DeletedTicketComments)
            .HasForeignKey(comment =>
                comment.DeletedByUserAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(comment => new
        {
            comment.TicketId,
            comment.CreatedDate
        });

        builder.HasIndex(comment => comment.UserAccountId);

        builder.HasQueryFilter(
            comment =>
                !comment.IsDeleted &&
                !comment.Ticket.IsDeleted);
    }
}
