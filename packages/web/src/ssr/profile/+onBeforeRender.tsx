import { Maybe } from '@audius/common/utils'
import { full as FullSdk } from '@audius/sdk'
import type { PageContextServer } from 'vike/types'

import { audiusSdk } from 'ssr/util'

export type ProfilePageProps = {
  user: Maybe<FullSdk.UserFull>
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle } = pageContext.routeParams

  try {
    const { data: users } = await audiusSdk.full.users.getUserByHandle({
      handle
    })
    const user = users?.[0]

    const pageProps = { user }

    return {
      pageContext: {
        pageProps
      }
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
