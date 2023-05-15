import { Tooltip } from 'components/tooltip'
import { UpdateDot } from 'components/update-dot'

import styles from './PlaylistUpdateDot.module.css'

const messages = { recentlyUpdatedTooltip: 'Recently Updated' }

export const PlaylistUpdateDot = () => {
  return (
    <Tooltip
      className={styles.tooltip}
      shouldWrapContent={true}
      shouldDismissOnClick={false}
      mouseEnterDelay={0.1}
      text={messages.recentlyUpdatedTooltip}
    >
      <UpdateDot className={styles.root} />
    </Tooltip>
  )
}
