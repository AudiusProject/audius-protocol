import { renderPage } from 'vike/server'

const DEBUG = true

addEventListener('fetch', (event) => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500
        })
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const pageContextInit = {
    urlOriginal: event.request.url
  }

  const pageContext = await renderPage(pageContextInit)

  const { httpResponse } = pageContext
  if (!httpResponse) {
    throw new Error(pageContext.errorWhileRendering)
  } else {
    const { body, statusCode: status, headers } = httpResponse
    return new Response(body, { headers, status })
  }
}
