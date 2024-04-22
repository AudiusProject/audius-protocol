import { Collection } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  collectionPageSelectors,
  CommonState
} from '@audius/common/store'
import { IconButtonProps, IconRocket, IconButton } from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { Tooltip } from 'components/tooltip'

import { PublishConfirmationModal } from './PublishConfirmationModal'

const { getCollection } = collectionPageSelectors
const { getCollectionHasHiddenTracks } = cacheCollectionsSelectors

const messages = {
  publish: 'Make Public',
  publishing: 'Making Public',
  emptyPlaylistTooltipText: 'You must add at least 1 song.',
  hiddenTracksTooltipText: (collectionType: 'playlist' | 'album') =>
    `You cannot make a ${collectionType} with hidden tracks public.`
}

type PublishButtonProps = Partial<IconButtonProps> & {
  collectionId: number
}

export const PublishButton = (props: PublishButtonProps) => {
  const { collectionId, ...other } = props
  const { _is_publishing, track_count, is_album } = useSelector(
    (state: CommonState) => getCollection(state, { id: collectionId })
  ) as Collection
  const hasHiddenTracks = useSelector((state: CommonState) =>
    getCollectionHasHiddenTracks(state, { id: collectionId })
  )

  const [isConfirming, toggleIsConfirming] = useToggle(false)

  const isDisabled = !track_count || track_count === 0 || hasHiddenTracks

  const publishButtonElement = (
    <IconButton
      icon={IconRocket}
      color='subdued'
      aria-label={_is_publishing ? messages.publishing : messages.publish}
      onClick={toggleIsConfirming}
      disabled={isDisabled || _is_publishing}
      {...other}
    />
  )

  return (
    <>
      {track_count === 0 || hasHiddenTracks ? (
        <Tooltip
          text={
            hasHiddenTracks
              ? messages.hiddenTracksTooltipText(
                is_album ? 'album' : 'playlist'
              )
              : messages.emptyPlaylistTooltipText
          }
        >
          <span>{publishButtonElement}</span>
        </Tooltip>
      ) : (
        publishButtonElement
      )}
      <PublishConfirmationModal
        collectionId={collectionId}
        isOpen={isConfirming}
        onClose={toggleIsConfirming}
      />
    </>
  )
}
