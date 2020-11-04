import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import AntModal from 'antd/lib/modal'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import styles from './Modal.module.css'

const Modal = props => {
  const {
    variant,
    className,
    headerClassName,
    title,
    width,
    visible,
    closeable,
    onClose,
    onVisible,
    children,
    zIndex
  } = props

  useEffect(() => {
    if (visible && onVisible) {
      onVisible()
    }
  }, [visible, onVisible])

  return (
    <AntModal
      className={cn(styles.antModal, {
        [styles.condensed]: variant === 'condensed'
      })}
      width={width}
      visible={visible}
      centered
      onCancel={onClose}
      destroyOnClose
      zIndex={zIndex}
    >
      <div className={cn(styles.modal, className)}>
        <div className={cn(styles.header, headerClassName)}>
          {closeable && (
            <IconRemove className={styles.iconRemove} onClick={onClose} />
          )}
          <div className={styles.title}>{title}</div>
        </div>
        {children}
      </div>
    </AntModal>
  )
}

Modal.propTypes = {
  variant: PropTypes.oneOf(['normal', 'condensed']).isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  width: PropTypes.number.isRequired,
  visible: PropTypes.bool.isRequired,
  closeable: PropTypes.bool.isRequired,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  onClose: PropTypes.func,
  onVisible: PropTypes.func,
  children: PropTypes.node,
  zIndex: PropTypes.number
}

Modal.defaultProps = {
  variant: 'normal',
  title: '',
  width: 360,
  visible: true,
  closeable: true,
  zIndex: 11000
}

export default Modal
