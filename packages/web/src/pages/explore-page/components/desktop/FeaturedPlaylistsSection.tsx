import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { CollectionCard } from 'components/collection'
import { useIsMobile } from 'hooks/useIsMobile'

import { Carousel } from './Carousel'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const FeaturedPlaylistsContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useExploreContent({ enabled: visible })
  const isMobile = useIsMobile()

  return (
    <>
      {!visible || !data?.featuredPlaylists || isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            // loading skeletons
            <CollectionCard key={i} id={0} size={isMobile ? 'xs' : 's'} />
          ))
        : data?.featuredPlaylists?.map((id) => (
            <CollectionCard key={id} id={id} size='s' />
          ))}
    </>
  )
}

export const FeaturedPlaylistsSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'FeaturedPlaylistsSection'
  })

  return (
    <Carousel ref={ref} title={messages.featuredPlaylists}>
      <FeaturedPlaylistsContent visible={inView} />
    </Carousel>
  )
}
