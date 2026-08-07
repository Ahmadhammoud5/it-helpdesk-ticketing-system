using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class TicketAttachmentConfiguration
    : IEntityTypeConfiguration<TicketAttachment>
{
    public void Configure(
        EntityTypeBuilder<TicketAttachment> builder)
    {
        builder.ToTable("TicketAttachments");

        builder.HasKey(attachment => attachment.Id);

        builder.Property(attachment => attachment.OriginalFileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(attachment => attachment.StoredFileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(attachment => attachment.StoragePath)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(attachment => attachment.ContentType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(attachment => attachment.FileSizeBytes)
            .IsRequired();

        builder.Property(attachment => attachment.CreatedDate)
            .HasColumnType("datetime2")
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(attachment => attachment.Ticket)
            .WithMany(ticket => ticket.Attachments)
            .HasForeignKey(attachment => attachment.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(attachment => attachment.UploadedByUser)
            .WithMany(user => user.TicketAttachments)
            .HasForeignKey(attachment => attachment.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(attachment => attachment.TicketId);

        builder.HasIndex(attachment => attachment.UploadedByUserId);

        builder.HasIndex(attachment => attachment.CreatedDate);

        builder.HasQueryFilter(
            attachment => !attachment.Ticket.IsDeleted);
    }
}