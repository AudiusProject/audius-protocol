import { useContext, forwardRef } from 'react'

import cn from 'classnames'

import { IconButton } from 'components/IconButton/IconButton'
import { IconRemove } from 'components/Icons'

import { ModalContext } from './ModalContext'
import styles from './ModalHeader.module.css'
import { ModalHeaderProps, ModalTitleProps } from './types'

/**
 * Header component to be used inside modals
 */
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  function ModalHeader(
    {
      className,
      onClose,
      dismissButtonClassName,
      showDismissButton = true,
      children,
      ...props
    },
    ref
  ) {
    return (
      <div
        className={cn(
          styles.headerContainer,
          { [styles.noDismissButton]: !showDismissButton },
          className
        )}
        ref={ref}
        {...props}>
        {showDismissButton ? (
          <IconButton
            aria-label='dismiss dialog'
            className={cn(styles.dismissButton, dismissButtonClassName)}
            icon={<IconRemove />}
            onClick={onClose}
          />
        ) : null}
        {children}
      </div>
    )
  }
)

/**
 * Title component to be used inside modal headers
 */
export const ModalTitle = forwardRef<HTMLDivElement, ModalTitleProps>(
  function ModalTitle(
    {
      subtitleClassName,
      icon,
      iconClassName,
      title,
      subtitle,
      titleId: titleIdProp,
      subtitleId: subtitleIdProp,
      ...props
    },
    ref
  ) {
    const modalContext = useContext(ModalContext)
    const titleId = titleIdProp || modalContext.titleId
    const subtitleId = subtitleIdProp || modalContext.subtitleId

    return (
      <>
        <div className={styles.titleContainer} {...props} ref={ref}>
          {icon == null ? null : (
            <div className={cn(styles.icon, iconClassName)}>{icon}</div>
          )}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        </div>
        {subtitle == null ? null : (
          <div className={cn(styles.subtitleContainer, subtitleClassName)}>
            <h3 id={subtitleId} className={styles.subtitle}>
              {subtitle}
            </h3>
          </div>
        )}
      </>
    )
  }
)
