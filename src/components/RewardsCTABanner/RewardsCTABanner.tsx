import React from 'react'
import clsx from 'clsx'

import Paper from 'components/Paper'
import styles from './RewardsCTABanner.module.css'
import { useIsMobile, useModalControls } from 'utils/hooks'
import AudioRewardsModal from 'components/AudioRewardsModal'
import { IconArrow, IconCrown } from '@audius/stems'

const messages = {
  rewards: '$AUDIO REWARDS',
  description: 'TOP 10 API APPS EACH WEEK WIN $AUDIO',
  learnMore: 'LEARN MORE'
}

type OwnProps = {
  className?: string
}

type RewardsCTABannerProps = OwnProps

const RewardsCTABanner: React.FC<RewardsCTABannerProps> = ({ className }) => {
  const { isOpen, onClick, onClose } = useModalControls()
  const isMobile = useIsMobile()

  return (
    <>
      <AudioRewardsModal isOpen={isOpen} onClose={onClose} />
      <Paper
        className={clsx(styles.container, {
          [className!]: className,
          [styles.mobile]: isMobile
        })}
        onClick={onClick}
      >
        <div className={styles.rewardsText}>
          <IconCrown className={styles.iconCrown} />
          {messages.rewards}
        </div>
        <span className={styles.descriptionText}>{messages.description}</span>

        {!isMobile && (
          <div className={styles.learnMore}>
            {messages.learnMore}
            <IconArrow />
          </div>
        )}
      </Paper>
    </>
  )
}

export default RewardsCTABanner
