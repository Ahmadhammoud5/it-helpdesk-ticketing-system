import httpClient from './httpClient'

export async function getReportSummary({ from, to }) {
  const response = await httpClient.get(
    '/reports/summary',
    {
      params: {
        from,
        to,
      },
    },
  )

  return response.data
}

function getDownloadFileName(contentDisposition) {
  if (!contentDisposition) {
    return ''
  }

  const encodedMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  )

  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }

  const fileNameMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i,
  )

  return fileNameMatch?.[1] ?? ''
}

async function downloadReport(path, { from, to }) {
  const response = await httpClient.get(path, {
    params: {
      from,
      to,
    },
    responseType: 'blob',
  })

  return {
    blob: response.data,
    fileName: getDownloadFileName(
      response.headers['content-disposition'],
    ),
  }
}

export function downloadReportExcel(period) {
  return downloadReport(
    '/reports/export/excel',
    period,
  )
}

export function downloadReportPdf(period) {
  return downloadReport(
    '/reports/export/pdf',
    period,
  )
}
