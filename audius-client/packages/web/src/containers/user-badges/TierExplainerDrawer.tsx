import React, { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { getModalVisibility, setVisibility } from 'common/store/ui/modals/slice'
import Drawer from 'components/drawer/Drawer'
import {
  audioTierMapPng,
  TierLevel,
  TierNumber
} from 'containers/audio-rewards-page/Tiers'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { useSelector } from 'utils/reducer'

import { BadgeTierText } from './ProfilePageBadge'
import styles from './TierExplainerDrawer.module.css'
import { messages } from './TierExplainerModal'
import { useProfileTier } from './hooks'

const TierExplainerDrawer = () => {
  // use the modal visibility state
  const isOpen = useSelector(state =>
    getModalVisibility(state, 'TiersExplainer')
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
