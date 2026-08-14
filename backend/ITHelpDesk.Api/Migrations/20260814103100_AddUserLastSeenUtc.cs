using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITHelpDesk.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLastSeenUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastSeenUtc",
                table: "AspNetUsers");
        }
    }
}
