using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.Api.Services;

public sealed class TicketCommentService
    : ITicketCommentService
{
    private const int MaximumCommentLength = 5000;

    private readonly ApplicationDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TicketCommentService> _logger;

    public TicketCommentService(
        ApplicationDbContext dbContext,
        INotificationService notificationService,
        ILogger<TicketCommentService> logger)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<
        TicketCommentResult<List<TicketCommentResponse>>>
        GetCommentsAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CancellationToken cancellationToken)
    {
        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketCommentResult<
                List<TicketCommentResponse>>.Failure(
                    TicketCommentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isSupportAgent))
        {
            return TicketCommentResult<
                List<TicketCommentResponse>>.Failure(
                    TicketCommentError.Forbidden);
        }

        var canViewInternalComments =
            isAdmin ||
            isManager ||
            (isSupportAgent &&
             ticket.AssignedToUserId == currentUserId);

        var query = _dbContext.TicketComments
            .AsNoTracking()
            .Where(comment =>
                comment.TicketId == ticketId);

        if (!canViewInternalComments)
        {
            query = query.Where(comment =>
                !comment.IsInternal);
        }

        var comments = await query
            .OrderBy(comment => comment.CreatedDate)
            .ThenBy(comment => comment.Id)
            .Select(comment =>
                new TicketCommentResponse
                {
                    Id = comment.Id,
                    TicketId = comment.TicketId,
                    UserAccountId =
                        comment.UserAccountId,
                    UserName =
                        comment.UserAccount.FirstName +
                        " " +
                        comment.UserAccount.LastName,
                    CommentText =
                        comment.CommentText,
                    IsInternal =
                        comment.IsInternal,
                    CreatedDate =
                        comment.CreatedDate,
                    UpdatedDate =
                        comment.UpdatedDate,
                    CanEdit =
                        comment.UserAccountId ==
                            currentUserId ||
                        isAdmin ||
                        isManager,
                    CanDelete =
                        comment.UserAccountId ==
                            currentUserId ||
                        isAdmin ||
                        isManager
                })
            .ToListAsync(cancellationToken);

        return TicketCommentResult<
            List<TicketCommentResponse>>.Success(
                comments);
    }

    public async Task<
        TicketCommentResult<TicketCommentResponse>>
        CreateCommentAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CreateTicketCommentRequest request,
            CancellationToken cancellationToken)
    {
        var validationError =
            ValidateCommentText(request.CommentText);

        if (validationError != TicketCommentError.None)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    validationError);
        }

        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isSupportAgent))
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.Forbidden);
        }

        if (ticket.StatusId is
            TicketStatusIds.Closed or
            TicketStatusIds.Cancelled)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.TicketIsFinal);
        }

        var canCreateInternalComment =
            isAdmin ||
            isManager ||
            (isSupportAgent &&
             ticket.AssignedToUserId == currentUserId);

        if (request.IsInternal &&
            !canCreateInternalComment)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError
                        .InternalCommentForbidden);
        }

        var user = await _dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                user => user.Id == currentUserId,
                cancellationToken);

        if (user is null)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.Forbidden);
        }

        var now = DateTime.UtcNow;

        var comment = new TicketComment
        {
            TicketId = ticket.Id,
            UserAccountId = currentUserId,
            CommentText =
                request.CommentText.Trim(),
            IsInternal = request.IsInternal,
            CreatedDate = now,
            IsDeleted = false
        };

        _dbContext.TicketComments.Add(comment);

        ticket.LastUpdatedDate = now;

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = currentUserId,
                TicketId = ticket.Id,
                ActivityType =
                    request.IsInternal
                        ? "InternalCommentAdded"
                        : "CommentAdded",
                Description =
                    request.IsInternal
                        ? $"An internal comment was added " +
                          $"to ticket {ticket.ReferenceNumber}."
                        : $"A comment was added to ticket " +
                          $"{ticket.ReferenceNumber}.",
                EntityType = nameof(TicketComment),
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        await NotifyParticipantsAsync(
            ticket,
            currentUserId,
            request.IsInternal,
            cancellationToken);

        return TicketCommentResult<
            TicketCommentResponse>.Success(
                new TicketCommentResponse
                {
                    Id = comment.Id,
                    TicketId = comment.TicketId,
                    UserAccountId =
                        comment.UserAccountId,
                    UserName =
                        $"{user.FirstName} {user.LastName}",
                    CommentText =
                        comment.CommentText,
                    IsInternal =
                        comment.IsInternal,
                    CreatedDate =
                        comment.CreatedDate,
                    UpdatedDate = null,
                    CanEdit = true,
                    CanDelete = true
                });
    }

    public async Task<
        TicketCommentResult<TicketCommentResponse>>
        UpdateCommentAsync(
            int ticketId,
            int commentId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            UpdateTicketCommentRequest request,
            CancellationToken cancellationToken)
    {
        var validationError =
            ValidateCommentText(request.CommentText);

        if (validationError != TicketCommentError.None)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    validationError);
        }

        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isSupportAgent))
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.Forbidden);
        }

        var comment = await _dbContext.TicketComments
            .Include(comment =>
                comment.UserAccount)
            .SingleOrDefaultAsync(
                comment =>
                    comment.Id == commentId &&
                    comment.TicketId == ticketId,
                cancellationToken);

        if (comment is null)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.CommentNotFound);
        }

        if (comment.UserAccountId != currentUserId &&
            !isAdmin &&
            !isManager)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.Forbidden);
        }

        var canManageInternalComment =
            isAdmin ||
            isManager ||
            (isSupportAgent &&
             ticket.AssignedToUserId == currentUserId);

        if (comment.IsInternal &&
            !canManageInternalComment)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.Forbidden);
        }

        if (ticket.StatusId is
            TicketStatusIds.Closed or
            TicketStatusIds.Cancelled)
        {
            return TicketCommentResult<
                TicketCommentResponse>.Failure(
                    TicketCommentError.TicketIsFinal);
        }

        var now = DateTime.UtcNow;

        comment.CommentText =
            request.CommentText.Trim();
        comment.UpdatedDate = now;

        ticket.LastUpdatedDate = now;

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = currentUserId,
                TicketId = ticket.Id,
                ActivityType = "CommentUpdated",
                Description =
                    $"Comment {comment.Id} was updated " +
                    $"on ticket {ticket.ReferenceNumber}.",
                EntityType = nameof(TicketComment),
                EntityId = comment.Id,
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return TicketCommentResult<
            TicketCommentResponse>.Success(
                new TicketCommentResponse
                {
                    Id = comment.Id,
                    TicketId = comment.TicketId,
                    UserAccountId =
                        comment.UserAccountId,
                    UserName =
                        $"{comment.UserAccount.FirstName} " +
                        $"{comment.UserAccount.LastName}",
                    CommentText =
                        comment.CommentText,
                    IsInternal =
                        comment.IsInternal,
                    CreatedDate =
                        comment.CreatedDate,
                    UpdatedDate =
                        comment.UpdatedDate,
                    CanEdit = true,
                    CanDelete = true
                });
    }

    public async Task<TicketCommentResult<bool>>
        DeleteCommentAsync(
            int ticketId,
            int commentId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isSupportAgent,
            CancellationToken cancellationToken)
    {
        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

        if (ticket is null)
        {
            return TicketCommentResult<bool>.Failure(
                TicketCommentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isSupportAgent))
        {
            return TicketCommentResult<bool>.Failure(
                TicketCommentError.Forbidden);
        }

        var comment = await _dbContext.TicketComments
            .SingleOrDefaultAsync(
                comment =>
                    comment.Id == commentId &&
                    comment.TicketId == ticketId,
                cancellationToken);

        if (comment is null)
        {
            return TicketCommentResult<bool>.Failure(
                TicketCommentError.CommentNotFound);
        }

        if (comment.UserAccountId != currentUserId &&
            !isAdmin &&
            !isManager)
        {
            return TicketCommentResult<bool>.Failure(
                TicketCommentError.Forbidden);
        }

        var canManageInternalComment =
            isAdmin ||
            isManager ||
            (isSupportAgent &&
             ticket.AssignedToUserId == currentUserId);

        if (comment.IsInternal &&
            !canManageInternalComment)
        {
            return TicketCommentResult<bool>.Failure(
                TicketCommentError.Forbidden);
        }

        var now = DateTime.UtcNow;

        comment.IsDeleted = true;
        comment.DeletedDate = now;
        comment.DeletedByUserAccountId =
            currentUserId;

        ticket.LastUpdatedDate = now;

        _dbContext.ActivityLogs.Add(
            new ActivityLog
            {
                UserAccountId = currentUserId,
                TicketId = ticket.Id,
                ActivityType = "CommentDeleted",
                Description =
                    $"Comment {comment.Id} was deleted " +
                    $"from ticket {ticket.ReferenceNumber}.",
                EntityType = nameof(TicketComment),
                EntityId = comment.Id,
                CreatedDate = now
            });

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return TicketCommentResult<bool>.Success(
            true);
    }

    private static TicketCommentError
        ValidateCommentText(
            string? commentText)
    {
        if (string.IsNullOrWhiteSpace(
                commentText))
        {
            return TicketCommentError.EmptyComment;
        }

        if (commentText.Trim().Length >
            MaximumCommentLength)
        {
            return TicketCommentError.CommentTooLong;
        }

        return TicketCommentError.None;
    }

    private async Task NotifyParticipantsAsync(
        Ticket ticket,
        int actorUserId,
        bool isInternal,
        CancellationToken cancellationToken)
    {
        try
        {
            var recipientIds = new HashSet<int>();

            if (!isInternal)
            {
                recipientIds.Add(ticket.CreatedByUserId);
            }

            if (ticket.AssignedToUserId.HasValue &&
                ticket.AssignedToUserId.Value != actorUserId)
            {
                var assignedAgentId =
                    ticket.AssignedToUserId.Value;

                var assignedUserIsEligible = await (
                        from user in
                            _dbContext.Users.AsNoTracking()
                        join userRole in
                            _dbContext.UserRoles.AsNoTracking()
                            on user.Id equals userRole.UserId
                        join role in
                            _dbContext.Roles.AsNoTracking()
                            on userRole.RoleId equals role.Id
                        where
                            user.Id == assignedAgentId &&
                            user.IsActive &&
                            role.Name ==
                                SystemRoles.ITSupportAgent
                        select user.Id)
                    .AnyAsync(cancellationToken);

                if (assignedUserIsEligible)
                {
                    recipientIds.Add(assignedAgentId);
                }
            }

            recipientIds.Remove(actorUserId);

            if (recipientIds.Count == 0)
            {
                return;
            }

            await _notificationService.CreateForUsersAsync(
                recipientIds,
                ticket.Id,
                isInternal
                    ? "InternalNoteAdded"
                    : "TicketCommentAdded",
                isInternal
                    ? "Internal note added"
                    : "New ticket comment",
                isInternal
                    ? $"Ticket {ticket.ReferenceNumber} has a new internal note."
                    : $"Ticket {ticket.ReferenceNumber} has a new public comment.",
                cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Comment on ticket {TicketId} was created, but participant notifications could not be persisted.",
                ticket.Id);
        }
    }
}
