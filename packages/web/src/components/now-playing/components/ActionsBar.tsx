import { memo } from 'react'

import { CastMethod } from '@audius/common'
import {
  IconShare,
  IconKebabHorizontal,
  IconAirplay,
  IconChromecast,
  IconButton
} from '@audius/stems'
import cn from 'classnames'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import { AirplayMessage } from 'services/native-mobile-interface/cast'
import { ShowGoogleCastPickerMessage } from 'services/native-mobile-interface/googleCast'

import styles from './ActionsBar.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type ActionsBarProps = {
  hasReposted: boolean
  hasFavorited: boolean
  isCasting: boolean
  isCollectible: boolean
  isOwner: boolean
  castMethod: CastMethod
  onToggleRepost: () => void
  onToggleFavorite: () => void
  onShare: () => void
  onClickOverflow: () => void
  isDarkMode: boolean
  isMatrixMode: boolean
}

const ActionsBar = ({
  castMethod,
  hasReposted,
  hasFavorited,
  isCasting,
  isCollectible = false,
  isOwner,
  onToggleRepost,
  onToggleFavorite,
  onShare,
  onClickOverflow,
  isDarkMode,
  isMatrixMode
}: ActionsBarProps) => {
  const isAirplay = castMethod === 'airplay'

  return (
    <div className={styles.actionsBar}>
      {NATIVE_MOBILE && (
        <IconButton
          aria-label='cast'
          isActive={isCasting}
          className={cn(styles.icon, styles.iconCast)}
          activeClassName={styles.activeButton}
          icon={isAirplay ? <IconAirplay /> : <IconChromecast />}
          onClick={(event) => {
            event.stopPropagation()
            const message = isAirplay
              ? new AirplayMessage()
              : new ShowGoogleCastPickerMessage()
            message.send()
          }}
        />
      )}
      <RepostButton
        isDarkMode={isDarkMode}
        isMatrixMode={isMatrixMode}
        isActive={hasReposted}
        isDisabled={isOwner || isCollectible}
        onClick={onToggleRepost}
        wrapperClassName={styles.icon}
        className={styles.repostButton}
        altVariant
      />
      <FavoriteButton
        isActive={hasFavorited}
        isDisabled={isOwner || isCollectible}
        isDarkMode={isDarkMode}
        isMatrixMode={isMatrixMode}
        onClick={onToggleFavorite}
        wrapperClassName={styles.icon}
        className={styles.favoriteButton}
        altVariant
      />
      <IconButton
        aria-label='share'
        disabled={isCollectible}
        icon={<IconShare />}
        onClick={onShare}
        className={styles.icon}
      />
      <IconButton
        aria-label='more actions'
        icon={<IconKebabHorizontal />}
        className={styles.icon}
        onClick={(event) => {
          event.stopPropagation()
          onClickOverflow()
        }}
      />
    </div>
  )
}

export default memo(ActionsBar)
