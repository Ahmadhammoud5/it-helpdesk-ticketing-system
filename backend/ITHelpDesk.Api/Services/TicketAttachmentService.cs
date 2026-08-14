using System.IO.Compression;
using ITHelpDesk.Api.Constants;
using ITHelpDesk.Api.Data;
using ITHelpDesk.Api.DTOs.Tickets;
using ITHelpDesk.Api.Entities;
using ITHelpDesk.Api.Options;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ITHelpDesk.Api.Services;

public sealed class TicketAttachmentService
    : ITicketAttachmentService
{
    private static readonly IReadOnlyDictionary<
        string,
        HashSet<string>> AllowedContentTypes =
        new Dictionary<string, HashSet<string>>(
            StringComparer.OrdinalIgnoreCase)
        {
            [".png"] = new(
                new[] { "image/png" },
                StringComparer.OrdinalIgnoreCase),

            [".jpg"] = new(
                new[] { "image/jpeg" },
                StringComparer.OrdinalIgnoreCase),

            [".jpeg"] = new(
                new[] { "image/jpeg" },
                StringComparer.OrdinalIgnoreCase),

            [".webp"] = new(
                new[] { "image/webp" },
                StringComparer.OrdinalIgnoreCase),

            [".pdf"] = new(
                new[] { "application/pdf" },
                StringComparer.OrdinalIgnoreCase),

            [".txt"] = new(
                new[] { "text/plain" },
                StringComparer.OrdinalIgnoreCase),

            [".docx"] = new(
                new[]
                {
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                },
                StringComparer.OrdinalIgnoreCase),

            [".xlsx"] = new(
                new[]
                {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                },
                StringComparer.OrdinalIgnoreCase)
        };

    private readonly ApplicationDbContext _dbContext;

    private readonly TicketAttachmentOptions _options;

    private readonly ILogger<TicketAttachmentService> _logger;

    private readonly string _storageRootPath;

    private readonly HashSet<string> _allowedExtensions;

    public TicketAttachmentService(
        ApplicationDbContext dbContext,
        IOptions<TicketAttachmentOptions> options,
        IWebHostEnvironment environment,
        ILogger<TicketAttachmentService> logger)
    {
        _dbContext = dbContext;
        _options = options.Value;
        _logger = logger;

        _allowedExtensions = new HashSet<string>(
            _options.AllowedExtensions.Select(
                extension =>
                    extension.StartsWith('.')
                        ? extension.ToLowerInvariant()
                        : "." + extension.ToLowerInvariant()),
            StringComparer.OrdinalIgnoreCase);

        _storageRootPath = Path.GetFullPath(
            Path.Combine(
                environment.ContentRootPath,
                _options.StorageRoot));

        Directory.CreateDirectory(_storageRootPath);
    }

    public async Task<TicketAttachmentResult<
        IReadOnlyList<TicketAttachmentResponse>>>
        GetByTicketIdAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isITSupportAgent,
            CancellationToken cancellationToken)
    {
        var ticket = await GetTicketAccessInfoAsync(
            ticketId,
            cancellationToken);

        if (ticket is null)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isITSupportAgent))
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.Forbidden);
        }

        var attachments =
            await _dbContext.TicketAttachments
                .AsNoTracking()
                .Where(
                    attachment =>
                        attachment.TicketId == ticketId)
                .OrderByDescending(
                    attachment =>
                        attachment.CreatedDate)
                .ThenByDescending(
                    attachment =>
                        attachment.Id)
                .Select(
                    attachment =>
                        new TicketAttachmentResponse
                        {
                            Id = attachment.Id,
                            TicketId =
                                attachment.TicketId,
                            OriginalFileName =
                                attachment.OriginalFileName,
                            ContentType =
                                attachment.ContentType,
                            FileSizeBytes =
                                attachment.FileSizeBytes,
                            UploadedByUserId =
                                attachment.UploadedByUserId,
                            UploadedByName =
                                attachment.UploadedByUser
                                    .FirstName
                                + " "
                                + attachment.UploadedByUser
                                    .LastName,
                            CreatedDate =
                                attachment.CreatedDate
                        })
                .ToListAsync(cancellationToken);

        return TicketAttachmentResult<
            IReadOnlyList<TicketAttachmentResponse>>
            .Success(attachments);
    }

    public async Task<TicketAttachmentResult<
        IReadOnlyList<TicketAttachmentResponse>>>
        UploadAsync(
            int ticketId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isITSupportAgent,
            IReadOnlyList<IFormFile> files,
            CancellationToken cancellationToken)
    {
        var ticket = await GetTicketAccessInfoAsync(
            ticketId,
            cancellationToken);

        if (ticket is null)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isITSupportAgent))
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.Forbidden);
        }

        if (ticket.StatusId is
            TicketStatusIds.Closed or
            TicketStatusIds.Cancelled)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.TicketIsFinal);
        }

        if (ticket.StatusId == TicketStatusIds.Resolved &&
            !isAdmin &&
            !isManager &&
            !isITSupportAgent)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.ResolvedIsReadOnly);
        }

        if (files is null || files.Count == 0)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.NoFiles);
        }

        if (files.Count > _options.MaxFilesPerUpload)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError.TooManyFiles);
        }

        var validatedFiles =
            new List<ValidatedUploadFile>();

        foreach (var file in files)
        {
            var validation =
                await ValidateFileAsync(
                    file,
                    cancellationToken);

            if (validation.Error !=
                TicketAttachmentError.None)
            {
                return TicketAttachmentResult<
                    IReadOnlyList<
                        TicketAttachmentResponse>>
                    .Failure(validation.Error);
            }

            validatedFiles.Add(validation.File!);
        }

        var currentTicketSize =
            await _dbContext.TicketAttachments
                .Where(
                    attachment =>
                        attachment.TicketId == ticketId)
                .Select(
                    attachment =>
                        (long?)attachment.FileSizeBytes)
                .SumAsync(cancellationToken)
            ?? 0L;

        var newFilesSize =
            validatedFiles.Sum(
                item => item.File.Length);

        if (currentTicketSize + newFilesSize >
            _options.MaxTotalSizePerTicketBytes)
        {
            return TicketAttachmentResult<
                IReadOnlyList<TicketAttachmentResponse>>
                .Failure(
                    TicketAttachmentError
                        .TicketStorageLimitExceeded);
        }

        var ticketDirectory =
            Path.Combine(
                _storageRootPath,
                ticketId.ToString());

        Directory.CreateDirectory(ticketDirectory);

        var createdAttachments =
            new List<TicketAttachment>();

        var savedPhysicalFiles =
            new List<string>();

        try
        {
            foreach (var validatedFile in
                     validatedFiles)
            {
                var storedFileName =
                    $"{Guid.NewGuid():N}" +
                    validatedFile.Extension;

                var fullPath =
                    Path.Combine(
                        ticketDirectory,
                        storedFileName);

                await using (
                    var targetStream =
                        new FileStream(
                            fullPath,
                            FileMode.CreateNew,
                            FileAccess.Write,
                            FileShare.None,
                            bufferSize: 81920,
                            useAsync: true))
                {
                    await validatedFile.File
                        .CopyToAsync(
                            targetStream,
                            cancellationToken);
                }

                savedPhysicalFiles.Add(fullPath);

                var relativeStoragePath =
                    $"{ticketId}/{storedFileName}";

                var attachment =
                    new TicketAttachment
                    {
                        TicketId = ticketId,
                        UploadedByUserId =
                            currentUserId,
                        OriginalFileName =
                            validatedFile
                                .OriginalFileName,
                        StoredFileName =
                            storedFileName,
                        StoragePath =
                            relativeStoragePath,
                        ContentType =
                            validatedFile.ContentType,
                        FileSizeBytes =
                            validatedFile.File.Length,
                        CreatedDate =
                            DateTime.UtcNow
                    };

                createdAttachments.Add(
                    attachment);
            }

            _dbContext.TicketAttachments
                .AddRange(createdAttachments);

            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }
        catch
        {
            foreach (var physicalFile in
                     savedPhysicalFiles)
            {
                try
                {
                    if (File.Exists(physicalFile))
                    {
                        File.Delete(physicalFile);
                    }
                }
                catch (Exception cleanupException)
                    when (
                        cleanupException is IOException
                        or UnauthorizedAccessException)
                {
                    _logger.LogWarning(
                        cleanupException,
                        "Unable to clean up ticket attachment file {FilePath}.",
                        physicalFile);
                }
            }

            throw;
        }

        var attachmentIds =
            createdAttachments
                .Select(attachment => attachment.Id)
                .ToArray();

        var responses =
            await _dbContext.TicketAttachments
                .AsNoTracking()
                .Where(
                    attachment =>
                        attachmentIds.Contains(
                            attachment.Id))
                .OrderByDescending(
                    attachment =>
                        attachment.CreatedDate)
                .ThenByDescending(
                    attachment =>
                        attachment.Id)
                .Select(
                    attachment =>
                        new TicketAttachmentResponse
                        {
                            Id = attachment.Id,
                            TicketId =
                                attachment.TicketId,
                            OriginalFileName =
                                attachment.OriginalFileName,
                            ContentType =
                                attachment.ContentType,
                            FileSizeBytes =
                                attachment.FileSizeBytes,
                            UploadedByUserId =
                                attachment.UploadedByUserId,
                            UploadedByName =
                                attachment.UploadedByUser
                                    .FirstName
                                + " "
                                + attachment.UploadedByUser
                                    .LastName,
                            CreatedDate =
                                attachment.CreatedDate
                        })
                .ToListAsync(cancellationToken);

        return TicketAttachmentResult<
            IReadOnlyList<TicketAttachmentResponse>>
            .Success(responses);
    }

    public async Task<TicketAttachmentResult<(
        byte[] FileBytes,
        string ContentType,
        string FileName)>> DownloadAsync(
        int ticketId,
        int attachmentId,
        int currentUserId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        CancellationToken cancellationToken)
    {
        var ticket = await GetTicketAccessInfoAsync(
            ticketId,
            cancellationToken);

        if (ticket is null)
        {
            return TicketAttachmentResult<(
                byte[] FileBytes,
                string ContentType,
                string FileName)>
                .Failure(
                    TicketAttachmentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isITSupportAgent))
        {
            return TicketAttachmentResult<(
                byte[] FileBytes,
                string ContentType,
                string FileName)>
                .Failure(
                    TicketAttachmentError.Forbidden);
        }

        var attachment =
            await _dbContext.TicketAttachments
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == attachmentId &&
                        item.TicketId == ticketId,
                    cancellationToken);

        if (attachment is null)
        {
            return TicketAttachmentResult<(
                byte[] FileBytes,
                string ContentType,
                string FileName)>
                .Failure(
                    TicketAttachmentError
                        .AttachmentNotFound);
        }

        var fullPath =
            GetSafeFullPath(
                attachment.StoragePath);

        if (fullPath is null ||
            !File.Exists(fullPath))
        {
            return TicketAttachmentResult<(
                byte[] FileBytes,
                string ContentType,
                string FileName)>
                .Failure(
                    TicketAttachmentError
                        .FileNotFoundOnDisk);
        }

        var fileBytes =
            await File.ReadAllBytesAsync(
                fullPath,
                cancellationToken);

        return TicketAttachmentResult<(
            byte[] FileBytes,
            string ContentType,
            string FileName)>
            .Success(
                (
                    fileBytes,
                    attachment.ContentType,
                    attachment.OriginalFileName
                ));
    }

    public async Task<TicketAttachmentResult<bool>>
        DeleteAsync(
            int ticketId,
            int attachmentId,
            int currentUserId,
            bool isAdmin,
            bool isManager,
            bool isITSupportAgent,
            CancellationToken cancellationToken)
    {
        var ticket = await GetTicketAccessInfoAsync(
            ticketId,
            cancellationToken);

        if (ticket is null)
        {
            return TicketAttachmentResult<bool>
                .Failure(
                    TicketAttachmentError.TicketNotFound);
        }

        if (!TicketAccessPolicy.CanView(
                ticket.CreatedByUserId,
                ticket.AssignedToUserId,
                currentUserId,
                isAdmin,
                isManager,
                isITSupportAgent))
        {
            return TicketAttachmentResult<bool>
                .Failure(
                    TicketAttachmentError.Forbidden);
        }

        if (ticket.StatusId is
            TicketStatusIds.Closed or
            TicketStatusIds.Cancelled)
        {
            return TicketAttachmentResult<bool>
                .Failure(
                    TicketAttachmentError.TicketIsFinal);
        }

        if (ticket.StatusId == TicketStatusIds.Resolved &&
            !isAdmin &&
            !isManager &&
            !isITSupportAgent)
        {
            return TicketAttachmentResult<bool>
                .Failure(
                    TicketAttachmentError.ResolvedIsReadOnly);
        }

        var attachment =
            await _dbContext.TicketAttachments
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == attachmentId &&
                        item.TicketId == ticketId,
                    cancellationToken);

        if (attachment is null)
        {
            return TicketAttachmentResult<bool>
                .Failure(
                    TicketAttachmentError
                        .AttachmentNotFound);
        }

        var canDelete =
            isAdmin ||
            isManager ||
            attachment.UploadedByUserId ==
            currentUserId;

        if (!canDelete)
        {
            return TicketAttachmentResult<bool>
                .Failure(
                    TicketAttachmentError.Forbidden);
        }

        var storagePath =
            attachment.StoragePath;

        _dbContext.TicketAttachments.Remove(
            attachment);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        TryDeletePhysicalFile(storagePath);

        return TicketAttachmentResult<bool>
            .Success(true);
    }

    private async Task<FileValidationResult>
        ValidateFileAsync(
            IFormFile file,
            CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            return FileValidationResult.Failure(
                TicketAttachmentError.NoFiles);
        }

        if (file.Length >
            _options.MaxFileSizeBytes)
        {
            return FileValidationResult.Failure(
                TicketAttachmentError.FileTooLarge);
        }

        var rawFileName =
            file.FileName
                .Replace('\\', '/');

        var originalFileName =
            Path.GetFileName(rawFileName)
                .Trim();

        if (string.IsNullOrWhiteSpace(
                originalFileName) ||
            originalFileName.Length > 255)
        {
            return FileValidationResult.Failure(
                TicketAttachmentError
                    .InvalidFileName);
        }

        var extension =
            Path.GetExtension(originalFileName)
                .ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(extension) ||
            !_allowedExtensions.Contains(extension))
        {
            return FileValidationResult.Failure(
                TicketAttachmentError
                    .UnsupportedFileType);
        }

        if (!AllowedContentTypes.TryGetValue(
                extension,
                out var contentTypes))
        {
            return FileValidationResult.Failure(
                TicketAttachmentError
                    .UnsupportedFileType);
        }

        var contentType =
            NormalizeContentType(
                file.ContentType);

        if (string.IsNullOrWhiteSpace(
                contentType) ||
            !contentTypes.Contains(contentType))
        {
            return FileValidationResult.Failure(
                TicketAttachmentError
                    .UnsupportedFileType);
        }

        var hasValidSignature =
            await HasValidFileSignatureAsync(
                file,
                extension,
                cancellationToken);

        if (!hasValidSignature)
        {
            return FileValidationResult.Failure(
                TicketAttachmentError
                    .UnsupportedFileType);
        }

        return FileValidationResult.Success(
            new ValidatedUploadFile(
                file,
                originalFileName,
                extension,
                contentType));
    }

    private static string NormalizeContentType(
        string contentType)
    {
        if (string.IsNullOrWhiteSpace(
                contentType))
        {
            return string.Empty;
        }

        var separatorIndex =
            contentType.IndexOf(';');

        return (
            separatorIndex >= 0
                ? contentType[..separatorIndex]
                : contentType)
            .Trim()
            .ToLowerInvariant();
    }

    private static async Task<bool>
        HasValidFileSignatureAsync(
            IFormFile file,
            string extension,
            CancellationToken cancellationToken)
    {
        if (extension.Equals(
                ".docx",
                StringComparison.OrdinalIgnoreCase))
        {
            return await IsValidOfficeDocumentAsync(
                file,
                "word/",
                cancellationToken);
        }

        if (extension.Equals(
                ".xlsx",
                StringComparison.OrdinalIgnoreCase))
        {
            return await IsValidOfficeDocumentAsync(
                file,
                "xl/",
                cancellationToken);
        }

        await using var stream =
            file.OpenReadStream();

        var headerLength =
            (int)Math.Min(
                file.Length,
                8192L);

        var buffer =
            new byte[headerLength];

        var bytesRead =
            await stream.ReadAsync(
                buffer.AsMemory(
                    0,
                    headerLength),
                cancellationToken);

        if (bytesRead == 0)
        {
            return false;
        }

        return extension.ToLowerInvariant()
            switch
            {
                ".png" =>
                    HasPrefix(
                        buffer,
                        bytesRead,
                        new byte[]
                        {
                            0x89,
                            0x50,
                            0x4E,
                            0x47,
                            0x0D,
                            0x0A,
                            0x1A,
                            0x0A
                        }),

                ".jpg" or ".jpeg" =>
                    HasPrefix(
                        buffer,
                        bytesRead,
                        new byte[]
                        {
                            0xFF,
                            0xD8,
                            0xFF
                        }),

                ".pdf" =>
                    HasPrefix(
                        buffer,
                        bytesRead,
                        new byte[]
                        {
                            0x25,
                            0x50,
                            0x44,
                            0x46,
                            0x2D
                        }),

                ".webp" =>
                    IsWebP(buffer, bytesRead),

                ".txt" =>
                    IsLikelyText(buffer, bytesRead),

                _ => false
            };
    }

    private static bool HasPrefix(
        byte[] buffer,
        int bytesRead,
        byte[] signature)
    {
        if (bytesRead < signature.Length)
        {
            return false;
        }

        for (var index = 0;
             index < signature.Length;
             index++)
        {
            if (buffer[index] !=
                signature[index])
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsWebP(
        byte[] buffer,
        int bytesRead)
    {
        if (bytesRead < 12)
        {
            return false;
        }

        return buffer[0] == 0x52 &&
               buffer[1] == 0x49 &&
               buffer[2] == 0x46 &&
               buffer[3] == 0x46 &&
               buffer[8] == 0x57 &&
               buffer[9] == 0x45 &&
               buffer[10] == 0x42 &&
               buffer[11] == 0x50;
    }

    private static bool IsLikelyText(
        byte[] buffer,
        int bytesRead)
    {
        for (var index = 0;
             index < bytesRead;
             index++)
        {
            if (buffer[index] == 0x00)
            {
                return false;
            }
        }

        return true;
    }

    private static async Task<bool>
        IsValidOfficeDocumentAsync(
            IFormFile file,
            string requiredFolder,
            CancellationToken cancellationToken)
    {
        try
        {
            await using var source =
                file.OpenReadStream();

            using var memoryStream =
                new MemoryStream();

            await source.CopyToAsync(
                memoryStream,
                cancellationToken);

            memoryStream.Position = 0;

            using var archive =
                new ZipArchive(
                    memoryStream,
                    ZipArchiveMode.Read,
                    leaveOpen: false);

            var hasContentTypes =
                archive.GetEntry(
                    "[Content_Types].xml")
                is not null;

            var hasRequiredFolder =
                archive.Entries.Any(
                    entry =>
                        entry.FullName.StartsWith(
                            requiredFolder,
                            StringComparison
                                .OrdinalIgnoreCase));

            return hasContentTypes &&
                   hasRequiredFolder;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private async Task<TicketAccessInfo?>
        GetTicketAccessInfoAsync(
            int ticketId,
            CancellationToken cancellationToken)
    {
        return await _dbContext.Tickets
            .AsNoTracking()
            .Where(
                ticket =>
                    ticket.Id == ticketId)
            .Select(
                ticket =>
                    new TicketAccessInfo
                    {
                        CreatedByUserId =
                            ticket.CreatedByUserId,
                        AssignedToUserId =
                            ticket.AssignedToUserId,
                        StatusId = ticket.StatusId
                    })
            .SingleOrDefaultAsync(
                cancellationToken);
    }

    private string? GetSafeFullPath(
        string storagePath)
    {
        try
        {
            var normalizedRelativePath =
                storagePath
                    .Replace(
                        '/',
                        Path.DirectorySeparatorChar)
                    .Replace(
                        '\\',
                        Path.DirectorySeparatorChar);

            var fullPath =
                Path.GetFullPath(
                    Path.Combine(
                        _storageRootPath,
                        normalizedRelativePath));

            var normalizedRoot =
                _storageRootPath
                    .TrimEnd(
                        Path.DirectorySeparatorChar,
                        Path.AltDirectorySeparatorChar)
                + Path.DirectorySeparatorChar;

            var comparison =
                OperatingSystem.IsWindows()
                    ? StringComparison
                        .OrdinalIgnoreCase
                    : StringComparison.Ordinal;

            if (!fullPath.StartsWith(
                    normalizedRoot,
                    comparison))
            {
                return null;
            }

            return fullPath;
        }
        catch (
            Exception exception)
            when (
                exception is ArgumentException
                or IOException
                or NotSupportedException)
        {
            return null;
        }
    }

    private void TryDeletePhysicalFile(
        string storagePath)
    {
        var fullPath =
            GetSafeFullPath(storagePath);

        if (fullPath is null)
        {
            _logger.LogWarning(
                "Unsafe ticket attachment storage path was rejected: {StoragePath}.",
                storagePath);

            return;
        }

        try
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
        catch (Exception exception)
            when (
                exception is IOException
                or UnauthorizedAccessException)
        {
            _logger.LogWarning(
                exception,
                "Unable to delete physical ticket attachment file {FilePath}.",
                fullPath);
        }
    }

    private sealed class TicketAccessInfo
    {
        public int CreatedByUserId { get; set; }

        public int? AssignedToUserId { get; set; }

        public int StatusId { get; set; }
    }

    private sealed record ValidatedUploadFile(
        IFormFile File,
        string OriginalFileName,
        string Extension,
        string ContentType);

    private sealed record FileValidationResult(
        TicketAttachmentError Error,
        ValidatedUploadFile? File)
    {
        public static FileValidationResult Success(
            ValidatedUploadFile file)
        {
            return new FileValidationResult(
                TicketAttachmentError.None,
                file);
        }

        public static FileValidationResult Failure(
            TicketAttachmentError error)
        {
            return new FileValidationResult(
                error,
                null);
        }
    }
}
