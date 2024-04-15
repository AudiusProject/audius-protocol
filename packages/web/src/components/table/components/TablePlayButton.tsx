import {
  IconPlaybackPause as IconPause,
  IconPlaybackPlay as IconPlay,
  useTheme
} from '@audius/harmony'
import cn from 'classnames'

import styles from './TablePlayButton.module.css'

type TablePlayButtonProps = {
  className?: string
  hideDefault?: boolean
  onClick?: (e: any) => void
  paused?: boolean
  playing?: boolean
  isTrackPremium?: boolean
  isLocked?: boolean
}

export const TablePlayButton = ({
  className,
  hideDefault = true,
  onClick,
  paused,
  playing = false,
  isTrackPremium = false,
  isLocked = false
}: TablePlayButtonProps) => {
  const {
    color: {
      // TODO: better way to not have to do this
      special,
      primary: { p300 }
    }
  } = useTheme()
  const showPremiumColor = isLocked && isTrackPremium
  return (
    <div onClick={onClick} className={cn(styles.tablePlayButton, className)}>
      {playing && !paused ? (
        <div>
          <IconPause className={styles.icon} />
        </div>
      ) : (
        <div>
          <IconPlay
            className={cn(styles.icon, {
              [styles.hideDefault]: hideDefault && !playing
            })}
            fill={showPremiumColor ? special.lightGreen : p300}
          />
        </div>
      )}
    </div>
  )
}
