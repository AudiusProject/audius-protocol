import { renderPage } from 'vike/server'

export async function handleSsr(url) {
  const pageContextInit = {
    urlOriginal: url
  }
  const pageContext = await renderPage(pageContextInit)

  return new Response('hi')
  //   const { httpResponse } = pageContext
  //   if (!httpResponse) {
  //     return null
  //   } else {
  //     const { body, statusCode: status, headers } = httpResponse
  //     return new Response(body, { headers, status })
  //   }
}
