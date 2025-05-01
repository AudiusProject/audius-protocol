import { useIsMobile } from 'hooks/useIsMobile'
import { createSeoDescription } from 'utils/seo'

import DesktopExplorePage from './components/desktop/ExplorePage'
import NewDesktopExplorePage from './components/desktop/NewExplorePage'
import MobileExplorePage from './components/mobile/ExplorePage'
const messages = {
  title: 'Explore',
  pageTitle: 'Explore featured content on Audius',
  description: createSeoDescription('Explore featured content on Audius')
}

export const ExplorePage = () => {
  const isMobile = useIsMobile()
  const props = {
    title: messages.title,
    pageTitle: messages.pageTitle,
    description: messages.description
  }

  const Component = isMobile ? MobileExplorePage : NewDesktopExplorePage
  return <Component {...props} />
}
