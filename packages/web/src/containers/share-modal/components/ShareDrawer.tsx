import React from 'react'

import { useModalState } from 'common/hooks/useModalState'
import ActionDrawer from 'components/action-drawer/ActionDrawer'

import styles from './ShareDrawer.module.css'

export const ShareDrawer = () => {
  const [isOpen, setIsOpen] = useModalState('Share')

  return (
    <ActionDrawer
      title='Share Track'
      actions={[]}
      didSelectRow={() => {}}
      onClose={() => setIsOpen(false)}
      isOpen={isOpen}
      classes={{ actionItem: styles.actionItem }}
    />
  )
}
