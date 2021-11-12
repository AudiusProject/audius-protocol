import React, {
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo
} from 'react'

import { Popup, PopupPosition } from '@audius/stems'
import { useSelector } from 'react-redux'

import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import { getUser } from 'common/store/cache/users/selectors'
import { MainContentContext } from 'containers/MainContentContext'
import { useFlag } from 'containers/remote-config/hooks'
import { FeatureFlags } from 'services/remote-config'
import { AppState } from 'store/types'
import zIndex from 'utils/zIndex'

import { ArtistRecommendations } from './ArtistRecommendations'
import styles from './ArtistRecommendationsPopup.module.css'

type ArtistRecommendationsPopupProps = {
  anchorRef: MutableRefObject<HTMLElement>
  artistId: ID
  isVisible: boolean
  onClose: () => void
  onArtistNameClicked: (handle: string) => void
  onFollowAll: (userIds: ID[]) => void
  onUnfollowAll: (userIds: ID[]) => void
}

export const ArtistRecommendationsPopup = ({
  anchorRef,
  artistId,
  isVisible,
  onClose
}: ArtistRecommendationsPopupProps) => {
  const { mainContentRef } = useContext(MainContentContext)
  const { isEnabled, isLoaded } = useFlag(
    FeatureFlags.ARTIST_RECOMMENDATIONS_ENABLED
  )
  // Get the artist
  const user = useSelector<AppState, User | null>(state =>
    getUser(state, { id: artistId })
  )
  if (!user) return null
  const { name } = user

  if (!isEnabled || !isLoaded) {
    return null
  }
  return (
    <Popup
      position={PopupPosition.BOTTOM_LEFT}
      anchorRef={anchorRef}
      isVisible={isVisible}
      zIndex={zIndex.FOLLOW_RECOMMENDATIONS_POPUP}
      onClose={onClose}
      className={styles.popup}
      containerRef={mainContentRef}
    >
      <ArtistRecommendations
        itemClassName={styles.popupItem}
        renderHeader={() => (
          <h2 className={styles.headerTitle}>Suggested Artists</h2>
        )}
        renderSubheader={() => (
          <p className={styles.popupItem}>
            Here are some accounts that vibe well with {name}
          </p>
        )}
        artistId={artistId}
        onClose={onClose}
      />
    </Popup>
  )
}
