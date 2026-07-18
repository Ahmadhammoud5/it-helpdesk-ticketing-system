using ITHelpDesk.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Data;

public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.FirstName)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.LastName)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(254);

            entity.Property(user => user.PhoneNumber)
                .HasMaxLength(30);

            entity.HasOne(user => user.Department)
                .WithMany(department => department.Users)
                .HasForeignKey(user => user.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Department>(entity =>
        {
            entity.ToTable("Departments");

            entity.HasKey(department => department.Id);

            entity.Property(department => department.DepartmentName)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(department => department.DepartmentName)
                .IsUnique();

            entity.Property(department => department.Description)
                .HasMaxLength(255);
        });
    }
}