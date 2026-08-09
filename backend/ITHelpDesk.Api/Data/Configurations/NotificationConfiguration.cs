using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class NotificationConfiguration
    : IEntityTypeConfiguration<Notification>
{
    public void Configure(
        EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(notification => notification.Id);

        builder.Property(notification => notification.Type)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(notification => notification.Title)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(notification => notification.Message)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(notification => notification.IsRead)
            .HasDefaultValue(false);

        builder.Property(notification => notification.CreatedDate)
            .IsRequired();

        builder.HasOne(notification => notification.User)
            .WithMany(user => user.Notifications)
            .HasForeignKey(notification => notification.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(notification => notification.Ticket)
            .WithMany(ticket => ticket.Notifications)
            .HasForeignKey(notification => notification.TicketId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(notification => new
        {
            notification.UserId,
            notification.IsRead,
            notification.CreatedDate
        });

        builder.HasIndex(notification => notification.TicketId);
    }
}