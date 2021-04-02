import { Modal, ModalProps } from '@audius/stems'
import React from 'react'
import { isMobile } from 'utils/clientUtil'
import Drawer, { DrawerProps } from 'components/drawer/Drawer'
import cn from 'classnames'

import styles from './ModalDrawer.module.css'

type ModalDrawerProps = ModalProps &
  DrawerProps & { useGradientTitle?: boolean }

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

  const gradientTitle = props.useGradientTitle ?? true

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      showTitleHeader={props.showTitleHeader}
      showDismissButton={props.showDismissButton}
      dismissOnClickOutside={props.dismissOnClickOutside}
      title={props.title}
      contentHorizontalPadding={props.contentHorizontalPadding}
      titleClassName={gradientTitle ? styles.modalTitle : undefined}
      headerContainerClassName={gradientTitle ? styles.modalHeader : undefined}
      bodyClassName={cn(styles.modalBody, {
        [styles.gradientHeader]: gradientTitle,
        [props.bodyClassName!]: !!props.bodyClassName
      })}
    >
      {props.children}
    </Modal>
  )
}

export default ModalDrawer
