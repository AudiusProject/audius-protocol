import { useCallback } from 'react'

import { useModalState } from 'common/hooks/useModalState'
import Drawer from 'components/drawer/Drawer'
import { useProfileTier } from 'hooks/wallet'
import {
  audioTierMapPng,
  TierLevel,
  TierNumber
} from 'pages/audio-rewards-page/Tiers'

import { BadgeTierText } from './ProfilePageBadge'
import styles from './TierExplainerDrawer.module.css'
import { messages } from './TierExplainerModal'

const TierExplainerDrawer = () => {
  const [isOpen, setIsOpen] = useModalState('TiersExplainer')

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const tier = useProfileTier()

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className={styles.drawer}>
        <div className={styles.top}>
          {audioTierMapPng[tier]}
          <div className={styles.topText}>
            <TierNumber tier={tier} />
            <BadgeTierText
              tier={tier}
              fontSize={28}
              className={styles.badgeColoredText}
            />
            <TierLevel tier={tier} />
          </div>
        </div>
        <div className={styles.textContainer}>
          {messages.desc1}
          <br />
          <br />
          {messages.desc2}
        </div>
      </div>
    </Drawer>
  )
}

export default TierExplainerDrawer
