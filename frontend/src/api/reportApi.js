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
