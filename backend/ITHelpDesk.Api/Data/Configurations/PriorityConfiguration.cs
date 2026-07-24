using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class PriorityConfiguration : IEntityTypeConfiguration<Priority>
{
    public void Configure(EntityTypeBuilder<Priority> builder)
    {
        builder.ToTable("Priorities");

        builder.HasKey(priority => priority.Id);

        builder.Property(priority => priority.PriorityName)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(priority => priority.PriorityName)
            .IsUnique();

        builder.Property(priority => priority.PriorityRank)
            .IsRequired();

        builder.HasIndex(priority => priority.PriorityRank)
            .IsUnique();

        builder.Property(priority => priority.ColorCode)
            .HasMaxLength(7)
            .IsRequired();

        builder.Property(priority => priority.IsActive)
            .HasDefaultValue(true);

        builder.HasData(
            new Priority
            {
                Id = 1,
                PriorityName = "Low",
                PriorityRank = 1,
                ColorCode = "#6B7280",
                IsActive = true
            },
            new Priority
            {
                Id = 2,
                PriorityName = "Medium",
                PriorityRank = 2,
                ColorCode = "#3B82F6",
                IsActive = true
            },
            new Priority
            {
                Id = 3,
                PriorityName = "High",
                PriorityRank = 3,
                ColorCode = "#F59E0B",
                IsActive = true
            },
            new Priority
            {
                Id = 4,
                PriorityName = "Critical",
                PriorityRank = 4,
                ColorCode = "#EF4444",
                IsActive = true
            }
        );
    }
}