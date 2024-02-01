import { MutableRefObject, useCallback, useMemo } from 'react'

import {
  playerActions,
  playerSelectors,
  PlaybackRate
} from '@audius/common/store'
import { PopupMenu, PopupMenuItem, PopupPosition } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import Icon0_5x from 'assets/img/iconPlaybackRate0_5x.svg'
import Icon0_8x from 'assets/img/iconPlaybackRate0_8x.svg'
import Icon1_1x from 'assets/img/iconPlaybackRate1_1x.svg'
import Icon1_2x from 'assets/img/iconPlaybackRate1_2x.svg'
import Icon1_5x from 'assets/img/iconPlaybackRate1_5x.svg'
import Icon1x from 'assets/img/iconPlaybackRate1x.svg'
import Icon2_5x from 'assets/img/iconPlaybackRate2_5x.svg'
import Icon2x from 'assets/img/iconPlaybackRate2x.svg'
import Icon3x from 'assets/img/iconPlaybackRate3x.svg'
import zIndex from 'utils/zIndex'

import styles from '../PlayBarButton.module.css'

const { setPlaybackRate } = playerActions
const { getPlaybackRate } = playerSelectors

export type PlaybackRateButtonProps = {
  isMobile: boolean
}

const rates: PlaybackRate[] = [
  '0.5x',
  '0.8x',
  '1x',
  '1.1x',
  '1.2x',
  '1.5x',
  '2x',
  '2.5x',
  '3x'
]

const playbackRateIconMap: Record<PlaybackRate, typeof Icon1x> = {
  '0.5x': Icon0_5x,
  '0.8x': Icon0_8x,
  '1x': Icon1x,
  '1.1x': Icon1_1x,
  '1.2x': Icon1_2x,
  '1.5x': Icon1_5x,
  '2x': Icon2x,
  '2.5x': Icon2_5x,
  '3x': Icon3x
}

export const PlaybackRateButton = ({ isMobile }: PlaybackRateButtonProps) => {
  const dispatch = useDispatch()
  const setRate = useCallback(
    (rate: PlaybackRate) => dispatch(setPlaybackRate({ rate })),
    [dispatch]
  )
  const playbackRate = useSelector(getPlaybackRate)
  const Icon = playbackRateIconMap[playbackRate]

  const items: PopupMenuItem[] = useMemo(
    () =>
      rates.map((rate) => ({
        text: rate,
        onClick: () => setRate(rate),
        className: styles.centeredItem
      })),
    [setRate]
  )

  const renderButton = useCallback(
    (ref: MutableRefObject<any>, triggerPopup: () => void) => (
      <button
        className={cn(styles.button, styles.playbackRateButton, {
          [styles.buttonFixedSize]: isMobile
        })}
        onClick={triggerPopup}
      >
        <Icon className={styles.noAnimation} ref={ref} />
      </button>
    ),
    [Icon, isMobile]
  )

  return (
    <PopupMenu
      title='Playback Speed'
      titleClassName={styles.popupTitle}
      items={items}
      hideCloseButton
      position={PopupPosition.TOP_CENTER}
      zIndex={zIndex.PLAY_BAR_POPUP_MENU}
      renderTrigger={renderButton}
    />
  )
}
