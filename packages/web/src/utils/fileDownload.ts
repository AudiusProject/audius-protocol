export async function downloadFile({
  url,
  headers,
}: {
  url: string
  headers?: Record<string, string>
}) {
  try {
    let options: RequestInit = { method: 'GET' }
    if (headers) {
      options.headers = headers
    }
    const response = await fetch(url, options)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    window.location.assign(blobUrl)
  } catch (err) {
    console.error(
      `Could not download file at url ${url}. Error: ${(err as Error).message}.`
    )
  }
}
