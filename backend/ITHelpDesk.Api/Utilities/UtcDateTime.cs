namespace ITHelpDesk.Api.Utilities;

public static class UtcDateTime
{
    public static DateTime? Normalize(DateTime? value)
    {
        return value.HasValue
            ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
            : null;
    }
}
