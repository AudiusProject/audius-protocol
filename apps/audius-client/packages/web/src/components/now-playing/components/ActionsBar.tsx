import React from 'react'

import {
  IconShare,
  IconKebabHorizontal,
  IconAirplay,
  IconChromecast
} from '@audius/stems'
import cn from 'classnames'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import IconButton from 'components/icon-button/IconButton'
import { Cast } from 'pages/settings-page/store/types'
import { AirplayMessage } from 'services/native-mobile-interface/cast'
import { ShowGoogleCastPickerMessage } from 'services/native-mobile-interface/googleCast'

import styles from './ActionsBar.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type ActionsBarProps = {
  hasReposted: boolean
  hasFavorited: boolean
  isCasting: boolean
  isOwner: boolean
  castMethod: Cast
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
  isOwner,
  onToggleRepost,
  onToggleFavorite,
  onShare,
  onClickOverflow,
  isDarkMode,
  isMatrixMode
}: ActionsBarProps) => {
  const isAirplay = castMethod === Cast.AIRPLAY

  return (
    <div className={styles.actionsBar}>
      {NATIVE_MOBILE && (
        <IconButton
          isActive={isCasting}
          className={cn(styles.icon, styles.iconCast)}
          activeClassName={styles.activeButton}
          icon={isAirplay ? <IconAirplay /> : <IconChromecast />}
          onClick={e => {
            e.stopPropagation()
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
        isDisabled={isOwner}
        onClick={onToggleRepost}
        wrapperClassName={styles.icon}
        className={styles.repostButton}
        altVariant
      />
      <FavoriteButton
        isActive={hasFavorited}
        isDisabled={isOwner}
        isDarkMode={isDarkMode}
        isMatrixMode={isMatrixMode}
        onClick={onToggleFavorite}
        wrapperClassName={styles.icon}
        className={styles.favoriteButton}
        altVariant
      />
      <IconButton
        icon={<IconShare />}
        onClick={onShare}
        className={styles.icon}
      />
      <IconButton
        icon={<IconKebabHorizontal />}
        className={styles.icon}
        onClick={e => {
          e.stopPropagation()
          onClickOverflow()
        }}
      />
    </div>
  )
}

export default React.memo(ActionsBar)
