import { Tooltip } from 'components/tooltip'
import { UpdateDot } from 'components/update-dot'

import styles from './PlaylistUpdateDot.module.css'

const messages = { recentlyUpdatedTooltip: 'Recently Updated' }

export const PlaylistUpdateDot = () => {
  return (
    <Tooltip
      mouseEnterDelay={0.1}
      text={messages.recentlyUpdatedTooltip}
      placement='right'
    >
      <UpdateDot className={styles.root} />
    </Tooltip>
  )
}
