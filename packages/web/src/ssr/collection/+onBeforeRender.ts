import type { PageContextServer } from 'vike/types'

export type CollectionPageProps = {}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  try {
    return {
      pageContext: {}
    }
  } catch (e) {
    console.error(
      'Error fetching collection for collection page SSR',
      'handle',
      handle,
      'slug',
      slug,
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
