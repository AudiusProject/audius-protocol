import { Playable, User } from '@audius/common/models'

import { useIsMobile } from 'hooks/useIsMobile'

import DeletedPageProvider from './DeletedPageProvider'
import DeletedPageDesktopContent from './components/desktop/DeletedPage'
import DeletedPageMobileContent from './components/mobile/DeletedPage'

type DeletedPageContentProps = {
  title: string
  description: string
  canonicalUrl: string
  structuredData?: Object
  playable: Playable
  user: User
  deletedByArtist?: boolean
}

const DeletedPage = ({
  title,
  description,
  canonicalUrl,
  structuredData,
  playable,
  user,
  deletedByArtist = true
}: DeletedPageContentProps) => {
  const isMobile = useIsMobile()

  const content = isMobile
    ? DeletedPageMobileContent
    : DeletedPageDesktopContent

  return (
    <DeletedPageProvider
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      playable={playable}
      user={user}
      deletedByArtist={deletedByArtist}
    >
      {content}
    </DeletedPageProvider>
  )
}

export default DeletedPage
