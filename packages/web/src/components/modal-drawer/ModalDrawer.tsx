import {
  Flex,
  Modal,
  ModalContent,
  ModalHeader,
  ModalProps,
  ModalTitle,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import Drawer, { DrawerProps } from 'components/drawer/Drawer'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './ModalDrawer.module.css'

type ModalDrawerProps = ModalProps &
  DrawerProps & {
    useGradientTitle?: boolean
    newModal?: boolean
    title?: string
    icon?: React.ReactNode
  }

/**
 * Either a modal or a drawer.
 * Not fully generic (has some built in styles) - can
 * pull this out later if it's more broadly useful.
 */
const ModalDrawer = (props: ModalDrawerProps) => {
  const { useGradientTitle, newModal, ...rest } = props
  const gradientTitle = useGradientTitle ?? true
  const isMobile = useIsMobile()
  if (isMobile) {
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
        <Flex column h='100%' gap='l'>
          <Flex pt='l' pb='s' justifyContent='center'>
            <Text variant='label' size='l' strength='strong' color='subdued'>
              {props.title}
            </Text>
          </Flex>
          <Flex pv='2xl' ph='l' h='100%'>
            {props.children}
          </Flex>
        </Flex>
      </Drawer>
    )
  }

  if (!newModal) {
    return (
      <Modal
        {...rest}
        titleClassName={cn(props.titleClassName, {
          [styles.modalTitle]: gradientTitle
        })}
        headerContainerClassName={cn(props.headerContainerClassName, {
          [styles.modalHeader]: gradientTitle
        })}
        bodyClassName={cn(styles.modalBody, {
          [styles.gradientHeader]: gradientTitle,
          [props.bodyClassName!]: !!props.bodyClassName
        })}
      />
    )
  }

  const { title, icon, children, isOpen, onClose, onClosed, size } = rest

  return (
    <Modal isOpen={isOpen} onClose={onClose} onClosed={onClosed} size={size}>
      <ModalHeader>
        <ModalTitle title={title} icon={icon} />
      </ModalHeader>
      <ModalContent>{children}</ModalContent>
    </Modal>
  )
}

export default ModalDrawer
