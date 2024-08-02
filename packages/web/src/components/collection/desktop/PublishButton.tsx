import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { Collection } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/src/services'
import {
  cacheCollectionsSelectors,
  collectionPageSelectors,
  CommonState
} from '@audius/common/store'
import { IconRocket, IconButton, IconButtonProps } from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { Tooltip } from 'components/tooltip'
import { useFlag } from 'hooks/useRemoteConfig'

import { PublishConfirmationModal } from './PublishConfirmationModal'

const { getCollection } = collectionPageSelectors
const { getCollectionHasHiddenTracks } = cacheCollectionsSelectors

const messages = {
  publish: 'Make Public',
  publishing: 'Making Public',
  emptyPlaylistTooltipText: 'You must add at least 1 song.',
  missingArtworkTooltipText: 'You must add artwork',
  hiddenTracksTooltipText: (collectionType: 'playlist' | 'album') =>
    `You cannot make a ${collectionType} with hidden tracks public.`
}

type PublishButtonProps = Partial<IconButtonProps> & {
  collectionId: number
}

export const PublishButton = (props: PublishButtonProps) => {
  const { collectionId, ...other } = props
  const { _is_publishing } = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })
  const { track_count, is_album, cover_art_sizes } = collection ?? {}

  const hasHiddenTracks = useSelector((state: CommonState) =>
    getCollectionHasHiddenTracks(state, { id: collectionId })
  )

  const { isEnabled: isHiddenPaidScheduledEnabled } = useFlag(
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )

  const [isConfirming, toggleIsConfirming] = useToggle(false)

  const isDisabled =
    !track_count ||
    track_count === 0 ||
    (!isHiddenPaidScheduledEnabled && hasHiddenTracks) ||
    !cover_art_sizes

  const publishButtonElement = (
    <Tooltip text={messages.publish}>
      <IconButton
        icon={IconRocket}
        onClick={toggleIsConfirming}
        aria-label='Publish Collection'
        size='2xl'
        color='subdued'
        disabled={isDisabled}
        isLoading={_is_publishing}
        {...other}
      />
    </Tooltip>
  )

  return (
    <>
      {isDisabled ? (
        <Tooltip
          text={
            !isHiddenPaidScheduledEnabled && hasHiddenTracks
              ? messages.hiddenTracksTooltipText(
                  is_album ? 'album' : 'playlist'
                )
              : !track_count || track_count === 0
              ? messages.emptyPlaylistTooltipText
              : !cover_art_sizes
              ? messages.missingArtworkTooltipText
              : null
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
