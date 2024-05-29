import type { PageContextServer } from 'vike/types'

export type ProfilePageProps = {}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle } = pageContext.routeParams

  try {
    return {
      pageContext: {}
    }
  } catch (e) {
    console.error(
      'Error fetching user for profile page SSR',
      'handle',
      handle,
      'error',
      e
    )
    return {
      pageContext: {
        pageProps: {}
      }
    }
  }
}
