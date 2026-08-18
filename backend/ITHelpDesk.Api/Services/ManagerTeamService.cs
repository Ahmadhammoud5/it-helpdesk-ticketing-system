using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Manager;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class ManagerTeamService : IManagerTeamService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IPresenceService _presenceService;

    public ManagerTeamService(
        ApplicationDbContext dbContext,
        IPresenceService presenceService)
    {
        _dbContext = dbContext;
        _presenceService = presenceService;
    }

    public async Task<ManagerTeamResponse> GetTeamAsync(
        CancellationToken cancellationToken = default)
    {
        var agents = await (
                from user in _dbContext.Users.AsNoTracking()
                join userRole in _dbContext.UserRoles.AsNoTracking()
                    on user.Id equals userRole.UserId
                join role in _dbContext.Roles.AsNoTracking()
                    on userRole.RoleId equals role.Id
                where role.Name == SystemRoles.ITSupportAgent
                orderby user.FirstName, user.LastName, user.Email
                select new AgentRecord(
                    user.Id,
                    user.FirstName + " " + user.LastName,
                    user.Email,
                    user.IsActive))
            .ToListAsync(cancellationToken);

        var activeAgents = agents
            .Where(agent => agent.IsActive)
            .ToList();

        var agentIds = agents
            .Select(agent => agent.UserId)
            .ToArray();

        var workloads = agentIds.Length == 0
            ? []
            : await _dbContext.Tickets
                .AsNoTracking()
                .Where(ticket =>
                    ticket.AssignedToUserId.HasValue &&
                    agentIds.Contains(ticket.AssignedToUserId.Value))
                .GroupBy(ticket => ticket.AssignedToUserId!.Value)
                .Select(group => new AgentWorkload(
                    group.Key,
                    group.Count(),
                    group.Count(ticket =>
                        ticket.StatusId == TicketStatusIds.InProgress),
                    group.Count(ticket =>
                        ticket.StatusId == TicketStatusIds.Pending)))
                .ToListAsync(cancellationToken);

        var workloadsByAgentId = workloads.ToDictionary(
            workload => workload.UserId);

        var unassignedTicketCount = await _dbContext.Tickets
            .AsNoTracking()
            .CountAsync(
                ticket =>
                    ticket.AssignedToUserId == null &&
                    (ticket.StatusId == TicketStatusIds.Open ||
                     ticket.StatusId == TicketStatusIds.InProgress ||
                     ticket.StatusId == TicketStatusIds.Pending),
                cancellationToken);

        var responseAgents = activeAgents
            .Select(agent =>
            {
                workloadsByAgentId.TryGetValue(
                    agent.UserId,
                    out var workload);

                return new ManagerTeamAgentResponse
                {
                    UserId = agent.UserId,
                    FullName = agent.FullName,
                    Email = agent.Email,
                    IsOnline = _presenceService.IsOnline(agent.UserId),
                    AssignedTicketCount =
                        workload?.AssignedTicketCount ?? 0,
                    InProgressTicketCount =
                        workload?.InProgressTicketCount ?? 0,
                    PendingTicketCount =
                        workload?.PendingTicketCount ?? 0
                };
            })
            .ToList();

        return new ManagerTeamResponse
        {
            SupportAgentCount = responseAgents.Count,
            OnlineCount = responseAgents.Count(agent => agent.IsOnline),
            AssignedTicketCount = workloads.Sum(
                workload => workload.AssignedTicketCount),
            UnassignedTicketCount = unassignedTicketCount,
            Agents = responseAgents
        };
    }

    private sealed record AgentRecord(
        int UserId,
        string FullName,
        string? Email,
        bool IsActive);

    private sealed record AgentWorkload(
        int UserId,
        int AssignedTicketCount,
        int InProgressTicketCount,
        int PendingTicketCount);
}
