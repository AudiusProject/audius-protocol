import { renderPage } from './node_modules/vike/server'

export async function handleSsr(url) {
  const pageContextInit = {
    urlOriginal: url
  }

  const pageContext = await renderPage(pageContextInit)

  const { httpResponse } = pageContext
  if (!httpResponse) {
    // TODO: throw sentry error
    // TODO: Once SSR is user-facing, show a nice error page
    return new Response(pageContext.errorWhileRendering, { status: 500 })
  } else {
    const { body, statusCode: status, headers } = httpResponse
    return new Response(body, { headers, status })
  }
}
