using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class StatusConfiguration : IEntityTypeConfiguration<Status>
{
    public void Configure(EntityTypeBuilder<Status> builder)
    {
        builder.ToTable("Statuses");

        builder.HasKey(status => status.Id);

        builder.Property(status => status.StatusName)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(status => status.StatusName)
            .IsUnique();

        builder.Property(status => status.SortOrder)
            .IsRequired();

        builder.Property(status => status.IsFinal)
            .HasDefaultValue(false);

        builder.Property(status => status.IsActive)
            .HasDefaultValue(true);

        builder.HasData(
            new Status
            {
                Id = 1,
                StatusName = "Open",
                SortOrder = 1,
                IsFinal = false,
                IsActive = true
            },
            new Status
            {
                Id = 2,
                StatusName = "In Progress",
                SortOrder = 2,
                IsFinal = false,
                IsActive = true
            },
            new Status
            {
                Id = 3,
                StatusName = "Pending",
                SortOrder = 3,
                IsFinal = false,
                IsActive = true
            },
            new Status
            {
                Id = 4,
                StatusName = "Resolved",
                SortOrder = 4,
                IsFinal = false,
                IsActive = true
            },
            new Status
            {
                Id = 5,
                StatusName = "Closed",
                SortOrder = 5,
                IsFinal = true,
                IsActive = true
            }
        );
    }
}