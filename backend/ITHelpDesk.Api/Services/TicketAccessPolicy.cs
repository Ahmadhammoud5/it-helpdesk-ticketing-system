namespace ITHelpDesk.Api.Services;

internal static class TicketAccessPolicy
{
    public static bool CanView(
        int createdByUserId,
        int? assignedToUserId,
        int currentUserId,
        bool isAdmin,
        bool isManager,
        bool isSupportAgent)
    {
        if (isAdmin || isManager)
        {
            return true;
        }

        if (isSupportAgent)
        {
            return assignedToUserId == currentUserId;
        }

        return createdByUserId == currentUserId;
    }
}
