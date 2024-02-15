import { RefObject, useContext } from 'react'

import { ID, User } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { Popup } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { MainContentContext } from 'pages/MainContentContext'
import { AppState } from 'store/types'
import zIndex from 'utils/zIndex'

import { ArtistRecommendations } from './ArtistRecommendations'
import styles from './ArtistRecommendationsPopup.module.css'
const { getUser } = cacheUsersSelectors

type Props = {
  anchorRef: RefObject<HTMLElement>
  artistId: ID
  isVisible: boolean
  onClose: () => void
}

export const ArtistRecommendationsPopup = (props: Props) => {
  const { anchorRef, artistId, isVisible, onClose } = props
  const { mainContentRef } = useContext(MainContentContext)

  // Get the artist
  const user = useSelector<AppState, User | null>((state) =>
    getUser(state, { id: artistId })
  )

  if (!user) return null
  const { name } = user

  return (
    <Popup
      anchorRef={anchorRef}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
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
