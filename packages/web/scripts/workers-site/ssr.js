import { renderPage } from 'vike/server'

export async function handleSsr(url) {
  const pageContextInit = {
    urlOriginal: url
  }
  const pageContext = await renderPage(pageContextInit)

  const { httpResponse } = pageContext
  if (!httpResponse) {
    return new Response(pageContext.errorWhileRendering, { status: 500 })
  } else {
    const { body, statusCode: status, headers } = httpResponse
    return new Response(body, { headers, status })
  }
}
