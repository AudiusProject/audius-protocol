import { Modal, ModalProps } from '@audius/stems'
import React from 'react'
import { isMobile } from 'utils/clientUtil'
import Drawer, { DrawerProps } from 'components/drawer/Drawer'

import styles from './ModalDrawer.module.css'

type ModalDrawerProps = ModalProps & DrawerProps

/**
 * Either a modal or a drawer.
 * Not fully generic (has some built in styles) - can
 * pull this out later if it's more broadly useful.
 */
const ModalDrawer = (props: ModalDrawerProps) => {
  if (isMobile()) {
    return (
      <Drawer
        isOpen={props.isOpen}
        onClose={props.onClose}
        isFullscreen={
          props.isFullscreen === undefined ? true : props.isFullscreen
        }
      >
        <div className={styles.drawer}>
          <div className={styles.titleContainer}>
            <span className={styles.drawerTitle}>{props.title}</span>
          </div>
          {props.children}
        </div>
      </Drawer>
    )
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      showTitleHeader
      showDismissButton
      title={props.title}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      bodyClassName={styles.modalBody}
    >
      {props.children}
    </Modal>
  )
}

export default ModalDrawer
