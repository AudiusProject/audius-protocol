import { Modal, ModalProps } from '@audius/stems'
import cn from 'classnames'

import Drawer, { DrawerProps } from 'components/drawer/Drawer'
import { isMobile } from 'utils/clientUtil'

import styles from './ModalDrawer.module.css'

type ModalDrawerProps = ModalProps &
  DrawerProps & { useGradientTitle?: boolean }

/**
 * Either a modal or a drawer.
 * Not fully generic (has some built in styles) - can
 * pull this out later if it's more broadly useful.
 */
const ModalDrawer = (props: ModalDrawerProps) => {
  const gradientTitle = props.useGradientTitle ?? true
  if (isMobile()) {
    return (
      <Drawer
        isOpen={props.isOpen}
        onClose={props.onClose}
        onClosed={props.onClosed}
        isFullscreen={
          props.isFullscreen === undefined ? true : props.isFullscreen
        }
        zIndex={props.zIndex}
        shouldClose={props.shouldClose}
      >
        <div className={cn(styles.drawer, props.wrapperClassName)}>
          <div className={styles.titleContainer}>
            <span
              className={cn({
                [props.titleClassName!]: !!props.titleClassName,
                [styles.drawerGradientTitle]: gradientTitle,
                [styles.drawerTitle]: !gradientTitle
              })}
            >
              {props.title}
            </span>
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
      onClosed={props.onClosed}
      showTitleHeader={props.showTitleHeader}
      showDismissButton={props.showDismissButton}
      dismissOnClickOutside={props.dismissOnClickOutside}
      title={props.title}
      contentHorizontalPadding={props.contentHorizontalPadding}
      titleClassName={cn(props.titleClassName ? props.titleClassName : '', {
        [styles.modalTitle]: gradientTitle
      })}
      headerContainerClassName={cn(
        props.headerContainerClassName ? props.headerContainerClassName : '',
        {
          [styles.modalHeader]: gradientTitle
        }
      )}
      bodyClassName={cn(styles.modalBody, {
        [styles.gradientHeader]: gradientTitle,
        [props.bodyClassName!]: !!props.bodyClassName
      })}
      zIndex={props.zIndex}
    >
      {props.children}
    </Modal>
  )
}

export default ModalDrawer
