import { useIsMobile } from 'hooks/useIsMobile'
import { createSeoDescription } from 'utils/seo'

import DesktopExplorePage from './components/desktop/ExplorePage'
import MobileExplorePage from './components/mobile/ExplorePage'

const messages = {
  title: 'Explore',
  pageTitle: 'Explore featured content on Audius',
  description: createSeoDescription('Explore featured content on Audius')
}

const ExplorePage = () => {
  const isMobile = useIsMobile()
  const props = {
    title: messages.title,
    pageTitle: messages.pageTitle,
    description: messages.description
  }

  const Component = isMobile ? MobileExplorePage : DesktopExplorePage
  return <Component {...props} />
}

export default ExplorePage
