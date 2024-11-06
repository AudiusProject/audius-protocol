import { useGatedContentAccess } from '@audius/common/hooks'
import { ModalSource, Theme, ID, UID } from '@audius/common/models'
import {
  cacheTracksSelectors,
  themeSelectors,
  usePremiumContentPurchaseModal,
  gatedContentSelectors,
  CommonState,
  PurchaseableContentType
} from '@audius/common/store'
import { Flex } from '@audius/harmony'
import { useSelector } from 'react-redux'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import Tooltip from 'components/tooltip/Tooltip'
import { GatedConditionsPill } from 'components/track/GatedConditionsPill'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'
import { shouldShowDark } from 'utils/theme/theme'

import styles from './SocialActions.module.css'

const { getTheme } = themeSelectors
const { getGatedContentStatusMap } = gatedContentSelectors
const { getTrack } = cacheTracksSelectors

type SocialActionsProps = {
  trackId: ID
  uid: UID
  isOwner: boolean
  onToggleRepost: (reposted: boolean, trackId: ID) => void
  onToggleFavorite: (favorited: boolean, trackId: ID) => void
}

const messages = {
  favorite: 'Favorite',
  unfavorite: 'Unfavorite',
  reposted: 'Reposted',
  repost: 'Repost'
}

export const SocialActions = ({
  trackId,
  uid,
  isOwner,
  onToggleRepost,
  onToggleFavorite
}: SocialActionsProps) => {
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const isFavoriteAndRepostDisabled = !uid || isOwner
  const favorited = track?.has_current_user_saved ?? false
  const reposted = track?.has_current_user_reposted ?? false
  const isUnlisted = track?.is_unlisted
  const favoriteText = favorited ? messages.unfavorite : messages.favorite
  const repostText = reposted ? messages.reposted : messages.repost

  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const gatedTrackStatus = trackId && gatedTrackStatusMap[trackId]
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const onClickPill = useRequiresAccountOnClick(() => {
    openPremiumContentPurchaseModal(
      { contentId: trackId, contentType: PurchaseableContentType.TRACK },
      { source: ModalSource.PlayBar }
    )
  }, [trackId, openPremiumContentPurchaseModal])

  const { hasStreamAccess } = useGatedContentAccess(track)

  const theme = useSelector(getTheme)
  const matrix = theme === Theme.MATRIX

  return (
    <Flex className={styles.root}>
      {track?.stream_conditions &&
      'usdc_purchase' in track.stream_conditions &&
      !hasStreamAccess ? (
        <GatedConditionsPill
          showIcon={false}
          streamConditions={track.stream_conditions}
          unlocking={gatedTrackStatus === 'UNLOCKING'}
          onClick={onClickPill}
          contentId={track.track_id}
          contentType={'track'}
        />
      ) : (
        <>
          <Flex className={styles.toggleRepostContainer}>
            <Tooltip
              text={repostText}
              disabled={isFavoriteAndRepostDisabled}
              mount='body'
              placement='top'
            >
              <Flex>
                {!isUnlisted ? (
                  <RepostButton
                    aria-label={repostText}
                    onClick={() => onToggleRepost(reposted, trackId)}
                    isActive={reposted}
                    isDisabled={
                      isFavoriteAndRepostDisabled || track?.is_unlisted
                    }
                    isDarkMode={shouldShowDark(theme)}
                    isMatrixMode={matrix}
                  />
                ) : null}
              </Flex>
            </Tooltip>
          </Flex>

          <Flex className={styles.toggleFavoriteContainer}>
            <Tooltip
              text={favoriteText}
              disabled={isFavoriteAndRepostDisabled}
              placement='top'
              mount='body'
            >
              <Flex>
                {!isUnlisted ? (
                  <FavoriteButton
                    isDisabled={
                      isFavoriteAndRepostDisabled || track?.is_unlisted
                    }
                    isMatrixMode={matrix}
                    isActive={favorited}
                    isDarkMode={shouldShowDark(theme)}
                    onClick={() => onToggleFavorite(favorited, trackId)}
                  />
                ) : null}
              </Flex>
            </Tooltip>
          </Flex>
        </>
      )}
    </Flex>
  )
}
