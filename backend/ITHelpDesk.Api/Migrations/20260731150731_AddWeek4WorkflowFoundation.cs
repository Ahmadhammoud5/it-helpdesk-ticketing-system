using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITHelpDesk.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWeek4WorkflowFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccumulatedWorkMinutes",
                table: "Tickets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledDate",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeletedByUserId",
                table: "Tickets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "WorkStartedAtUtc",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserAccountId = table.Column<int>(type: "int", nullable: true),
                    TicketId = table.Column<int>(type: "int", nullable: true),
                    ActivityType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    EntityId = table.Column<int>(type: "int", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityLogs_AspNetUsers_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActivityLogs_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    AssignedToUserAccountId = table.Column<int>(type: "int", nullable: false),
                    AssignedByUserAccountId = table.Column<int>(type: "int", nullable: false),
                    IsEscalation = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    AssignmentReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UnassignedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketAssignments_AspNetUsers_AssignedByUserAccountId",
                        column: x => x.AssignedByUserAccountId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketAssignments_AspNetUsers_AssignedToUserAccountId",
                        column: x => x.AssignedToUserAccountId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketAssignments_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    UserAccountId = table.Column<int>(type: "int", nullable: false),
                    CommentText = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
                    IsInternal = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedByUserAccountId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketComments_AspNetUsers_DeletedByUserAccountId",
                        column: x => x.DeletedByUserAccountId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketComments_AspNetUsers_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketComments_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketHistory",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    ChangedByUserAccountId = table.Column<int>(type: "int", nullable: false),
                    FieldName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketHistory_AspNetUsers_ChangedByUserAccountId",
                        column: x => x.ChangedByUserAccountId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketHistory_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Statuses",
                columns: new[] { "Id", "IsActive", "IsFinal", "SortOrder", "StatusName" },
                values: new object[] { 6, true, true, 6, "Cancelled" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_DeletedByUserId",
                table: "Tickets",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_ActivityType",
                table: "ActivityLogs",
                column: "ActivityType");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_CreatedDate",
                table: "ActivityLogs",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_TicketId",
                table: "ActivityLogs",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_UserAccountId",
                table: "ActivityLogs",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketAssignments_AssignedByUserAccountId",
                table: "TicketAssignments",
                column: "AssignedByUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketAssignments_AssignedToUserAccountId_UnassignedDate",
                table: "TicketAssignments",
                columns: new[] { "AssignedToUserAccountId", "UnassignedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketAssignments_TicketId",
                table: "TicketAssignments",
                column: "TicketId",
                unique: true,
                filter: "[UnassignedDate] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TicketComments_DeletedByUserAccountId",
                table: "TicketComments",
                column: "DeletedByUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketComments_TicketId_CreatedDate",
                table: "TicketComments",
                columns: new[] { "TicketId", "CreatedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketComments_UserAccountId",
                table: "TicketComments",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketHistory_ChangedByUserAccountId",
                table: "TicketHistory",
                column: "ChangedByUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketHistory_TicketId_ChangedDate",
                table: "TicketHistory",
                columns: new[] { "TicketId", "ChangedDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_AspNetUsers_DeletedByUserId",
                table: "Tickets",
                column: "DeletedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_AspNetUsers_DeletedByUserId",
                table: "Tickets");

            migrationBuilder.DropTable(
                name: "ActivityLogs");

            migrationBuilder.DropTable(
                name: "TicketAssignments");

            migrationBuilder.DropTable(
                name: "TicketComments");

            migrationBuilder.DropTable(
                name: "TicketHistory");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_DeletedByUserId",
                table: "Tickets");

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "AccumulatedWorkMinutes",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "CancelledDate",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "WorkStartedAtUtc",
                table: "Tickets");
        }
    }
}
