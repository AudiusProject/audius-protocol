import {
  ID,
  UID,
  usePremiumContentPurchaseModal,
  premiumContentSelectors,
  themeSelectors,
  Theme,
  usePremiumContentAccess,
  cacheTracksSelectors,
  CommonState
} from '@audius/common'
import { useSelector } from 'react-redux'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import Tooltip from 'components/tooltip/Tooltip'
import { PremiumConditionsPill } from 'components/track/PremiumConditionsPill'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'
import { shouldShowDark } from 'utils/theme/theme'

import styles from './SocialActions.module.css'

const { getTheme } = themeSelectors
const { getPremiumTrackStatusMap } = premiumContentSelectors
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
  const favoriteText = favorited ? messages.unfavorite : messages.favorite
  const repostText = reposted ? messages.reposted : messages.repost

  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = trackId && premiumTrackStatusMap[trackId]
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const onClickPremiumPill = useAuthenticatedClickCallback(() => {
    openPremiumContentPurchaseModal({ contentId: trackId })
  }, [trackId, openPremiumContentPurchaseModal])

  const { doesUserHaveAccess } = usePremiumContentAccess(track)

  const theme = useSelector(getTheme)
  const matrix = theme === Theme.MATRIX

  return (
    <div className={styles.root}>
      {track?.premium_conditions &&
      'usdc_purchase' in track.premium_conditions &&
      !doesUserHaveAccess ? (
        <PremiumConditionsPill
          showIcon={false}
          premiumConditions={track.premium_conditions}
          unlocking={premiumTrackStatus === 'UNLOCKING'}
          onClick={onClickPremiumPill}
        />
      ) : (
        <>
          <div className={styles.toggleRepostContainer}>
            <Tooltip
              text={repostText}
              disabled={isFavoriteAndRepostDisabled}
              mount='body'
              placement='top'
            >
              <span>
                <RepostButton
                  aria-label={repostText}
                  onClick={() => onToggleRepost(reposted, trackId)}
                  isActive={reposted}
                  isDisabled={isFavoriteAndRepostDisabled || track?.is_unlisted}
                  isDarkMode={shouldShowDark(theme)}
                  isMatrixMode={matrix}
                />
              </span>
            </Tooltip>
          </div>

          <div className={styles.toggleFavoriteContainer}>
            <Tooltip
              text={favoriteText}
              disabled={isFavoriteAndRepostDisabled}
              placement='top'
              mount='body'
            >
              <span>
                <FavoriteButton
                  isDisabled={isFavoriteAndRepostDisabled || track?.is_unlisted}
                  isMatrixMode={matrix}
                  isActive={favorited}
                  isDarkMode={shouldShowDark(theme)}
                  onClick={() => onToggleFavorite(favorited, trackId)}
                />
              </span>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  )
}
