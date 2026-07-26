using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ITHelpDesk.Api.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(category => category.Id);

        builder.Property(category => category.CategoryName)
            .HasMaxLength(80)
            .IsRequired();

        builder.HasIndex(category => category.CategoryName)
            .IsUnique();

        builder.Property(category => category.Description)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(category => category.IsActive)
            .HasDefaultValue(true);

        builder.HasData(
            new Category
            {
                Id = 1,
                CategoryName = "Hardware",
                Description = "Physical computer, printer, device or peripheral issues.",
                IsActive = true
            },
            new Category
            {
                Id = 2,
                CategoryName = "Software",
                Description = "Application installation, configuration or software errors.",
                IsActive = true
            },
            new Category
            {
                Id = 3,
                CategoryName = "Network",
                Description = "Internet, Wi-Fi, VPN or internal network issues.",
                IsActive = true
            },
            new Category
            {
                Id = 4,
                CategoryName = "Email",
                Description = "Email account, delivery, synchronization or configuration issues.",
                IsActive = true
            },
            new Category
            {
                Id = 5,
                CategoryName = "Access Request",
                Description = "Account, permission or system access requests.",
                IsActive = true
            },
            new Category
            {
                Id = 6,
                CategoryName = "Other",
                Description = "Support requests that do not match another category.",
                IsActive = true
            }
        );
    }
}