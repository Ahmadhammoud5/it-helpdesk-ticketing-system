namespace ITHelpDesk.Api.Constants;

public static class SystemRoles
{
    public const string Admin = "Admin";
    public const string ITSupportAgent = "ITSupportAgent";
    public const string Manager = "Manager";
    public const string Employee = "Employee";

    public static readonly string[] All =
    [
        Admin,
        ITSupportAgent,
        Manager,
        Employee
    ];
}