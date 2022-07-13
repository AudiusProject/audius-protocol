import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import { ReactComponent as IconMultiselectAdd } from 'assets/img/iconMultiselectAdd.svg'
import { ReactComponent as IconMultiselectRemove } from 'assets/img/iconMultiselectRemove.svg'
import Tooltip from 'components/tooltip/Tooltip'

import { trimServiceName, countryCodeToFlag } from '../utils'

import styles from './Service.module.css'

const Service = (props) => {
  const {
    className,
    id,
    disabled,
    onAdd,
    onRemove,
    country,
    name,
    draggable,
    dragging,
    isEmpty,
    isSyncing,
    handleProps,
    forwardRef,
    ...otherProps
  } = props
  return (
    <div
      ref={forwardRef}
      id={id}
      {...otherProps}
      className={cn(styles.service, className, {
        [styles.dragging]: dragging
      })}>
      {isEmpty ? (
        <div className={styles.empty}>
          {name}
          <div className={styles.hide} {...handleProps} />
        </div>
      ) : (
        <div className={styles.wrapper}>
          <div
            className={cn(styles.button, {
              [styles.disabled]: disabled || isSyncing
            })}>
            {isSyncing ? (
              <div className={styles.syncing}>
                <Lottie
                  options={{
                    loop: true,
                    autoplay: true,
                    animationData: loadingSpinner
                  }}
                />
              </div>
            ) : (
              <>
                {onAdd && (
                  <Tooltip text='Add'>
                    <IconMultiselectAdd
                      className={styles.add}
                      onClick={disabled ? () => {} : onAdd}
                    />
                  </Tooltip>
                )}
                {onRemove && (
                  <Tooltip text='Remove'>
                    <IconMultiselectRemove
                      className={styles.remove}
                      onClick={disabled ? () => {} : onRemove}
                    />
                  </Tooltip>
                )}
              </>
            )}
          </div>
          <div className={styles.country}>{countryCodeToFlag(country)}</div>
          <div className={styles.divider}>-</div>
          <div className={styles.serviceName}>
            <Tooltip text={name} mouseEnterDelay={0.1} mouseLeaveDelay={0.1}>
              {trimServiceName(name)}
            </Tooltip>
          </div>
          {draggable && (
            <div className={styles.drag} {...handleProps}>
              <Tooltip text='Drag to Rearrange'>
                <IconDrag className={styles.iconDrag} />
              </Tooltip>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

Service.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string,
  country: PropTypes.string,
  disabled: PropTypes.bool,
  draggable: PropTypes.bool,
  dragging: PropTypes.bool,
  // Empty state
  isEmpty: PropTypes.bool,
  isSycing: PropTypes.bool,
  text: PropTypes.string,
  // From Drag + Drop
  handleProps: PropTypes.object,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func
}

export default Service
