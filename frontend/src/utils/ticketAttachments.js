export const attachmentAccept =
  '.png,.jpg,.jpeg,.webp,.pdf,.txt,.docx,.xlsx'

export const allowedAttachmentExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.pdf',
  '.txt',
  '.docx',
  '.xlsx',
])

export const maxAttachmentFileSize =
  10 * 1024 * 1024

export const maxAttachmentsPerUpload = 5

export const maxTicketAttachmentSize =
  50 * 1024 * 1024

export function formatFileSize(bytesValue) {
  const bytes = Number(bytesValue) || 0

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }

  const megabytes = kilobytes / 1024

  return `${megabytes.toFixed(1)} MB`
}

export function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.')

  if (lastDotIndex < 0) {
    return ''
  }

  return fileName
    .slice(lastDotIndex)
    .toLowerCase()
}

export function validateAttachmentFiles(
  files,
  currentStoredSize = 0,
) {
  if (files.length > maxAttachmentsPerUpload) {
    return 'Select no more than 5 files at once.'
  }

  const emptyFile = files.find(
    (file) => file.size <= 0,
  )

  if (emptyFile) {
    return `${emptyFile.name} is empty and cannot be uploaded.`
  }

  const invalidNameFile = files.find(
    (file) =>
      !file.name.trim() || file.name.length > 255,
  )

  if (invalidNameFile) {
    return 'A selected attachment has an invalid file name.'
  }

  const invalidTypeFile = files.find(
    (file) =>
      !allowedAttachmentExtensions.has(
        getFileExtension(file.name),
      ),
  )

  if (invalidTypeFile) {
    return `${invalidTypeFile.name} has an unsupported file type.`
  }

  const oversizedFile = files.find(
    (file) => file.size > maxAttachmentFileSize,
  )

  if (oversizedFile) {
    return `${oversizedFile.name} exceeds the 10 MB file limit.`
  }

  const selectedSize = files.reduce(
    (total, file) => total + file.size,
    0,
  )

  if (
    currentStoredSize + selectedSize >
    maxTicketAttachmentSize
  ) {
    return 'These files would exceed the 50 MB attachment limit for this ticket.'
  }

  return ''
}
