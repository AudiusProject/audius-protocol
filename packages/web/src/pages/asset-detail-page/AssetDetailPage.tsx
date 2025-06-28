import { Redirect, useParams } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import { AssetDetailTabs } from './AssetDetailTabs'
import { ACCEPTED_ROUTES } from './constants'
import { AcceptedRouteKey } from './types'

export const AssetDetailPage = () => {
  const { slug } = useParams<{ slug: string }>()

  if (!slug || !(slug in ACCEPTED_ROUTES)) {
    return <Redirect to='/wallet' />
  }

  // At this point, we know slug is a valid key
  const typedSlug = slug as AcceptedRouteKey
  const routeConfig = ACCEPTED_ROUTES[typedSlug]
  const title = routeConfig.title

  const { tabs, body } = AssetDetailTabs({ slug: typedSlug })

  const header = (
    <Header primary={title} showBackButton={true} bottomBar={tabs} />
  )
  return (
    <Page title={title} header={header}>
      {body}
    </Page>
  )
}
