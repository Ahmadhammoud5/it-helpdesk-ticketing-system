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

    public DbSet<PasswordResetCode> PasswordResetCodes
        => Set<PasswordResetCode>();

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

        builder.Entity<PasswordResetCode>(entity =>
        {
            entity.ToTable("PasswordResetCodes");

            entity.HasKey(resetCode => resetCode.Id);

            entity.Property(resetCode => resetCode.CodeHash)
                .HasMaxLength(128)
                .IsRequired();

            entity.Property(resetCode => resetCode.FailedAttempts)
                .HasDefaultValue(0);

            entity.HasOne(resetCode => resetCode.User)
                .WithMany(user => user.PasswordResetCodes)
                .HasForeignKey(resetCode => resetCode.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(resetCode => new
            {
                resetCode.UserId,
                resetCode.CreatedAtUtc
            });
        });
    }
}