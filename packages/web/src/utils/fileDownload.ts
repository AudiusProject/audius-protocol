export async function downloadFile({
  url,
  data,
  signature,
  isAuthenticated = true
}: {
  url: string
  data: string
  signature: string
  isAuthenticated?: boolean
}) {
  try {
    const options = isAuthenticated
      ? // maybe data and signature are generated within this function?
        {
          method: 'GET',
          headers: {
            'encoded-data-message': data,
            'encoded-data-signature': signature
          }
        }
      : { method: 'GET' }
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
