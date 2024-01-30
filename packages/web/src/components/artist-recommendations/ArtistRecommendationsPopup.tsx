import { RefObject, useContext } from 'react'

import { cacheUsersSelectors } from '@audius/common'
import { ID, User } from '@audius/common/models'
import { Popup, PopupPosition } from '@audius/stems'
import { useSelector } from 'react-redux'

import { MainContentContext } from 'pages/MainContentContext'
import { AppState } from 'store/types'
import zIndex from 'utils/zIndex'

import { ArtistRecommendations } from './ArtistRecommendations'
import styles from './ArtistRecommendationsPopup.module.css'
const { getUser } = cacheUsersSelectors

type ArtistRecommendationsPopupProps = {
  anchorRef: RefObject<HTMLElement>
  artistId: ID
  isVisible: boolean
  onClose: () => void
}

export const ArtistRecommendationsPopup = ({
  anchorRef,
  artistId,
  isVisible,
  onClose
}: ArtistRecommendationsPopupProps) => {
  const { mainContentRef } = useContext(MainContentContext)

  // Get the artist
  const user = useSelector<AppState, User | null>((state) =>
    getUser(state, { id: artistId })
  )
  if (!user) return null
  const { name } = user

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
