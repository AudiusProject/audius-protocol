import Drawer from 'components/drawer/Drawer'
import {
  audioTierMapPng,
  TierLevel,
  TierNumber
} from 'containers/audio-rewards-page/Tiers'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { setVisibility } from 'store/application/ui/modals/slice'
import { useSelector } from 'utils/reducer'
import { useProfileTier } from './hooks'
import { BadgeTierText } from './ProfilePageBadge'
import { messages } from './TierExplainerModal'

import styles from './TierExplainerDrawer.module.css'

const TierExplainerDrawer = () => {
  // use the modal visibility state
  const isOpen = useSelector(
    state => state.application.ui.modals.TiersExplainer
  )
  const keyboardVisible = useSelector(getKeyboardVisibility)
  const dispatch = useDispatch()
  const onClose = useCallback(() => {
    dispatch(setVisibility({ modal: 'TiersExplainer', visible: false }))
  }, [dispatch])

  const tier = useProfileTier()

  return (
    <Drawer isOpen={isOpen} keyboardVisible={keyboardVisible} onClose={onClose}>
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
