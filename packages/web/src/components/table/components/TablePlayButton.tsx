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
}

export const TablePlayButton = ({
  className,
  hideDefault = true,
  onClick,
  paused,
  playing = false,
  isTrackPremium = false
}: TablePlayButtonProps) => {
  const {
    color: { special }
  } = useTheme()
  console.log(isTrackPremium)
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
            color={isTrackPremium ? special.green : 'active'}
            css={{}}
          />
        </div>
      )}
    </div>
  )
}
