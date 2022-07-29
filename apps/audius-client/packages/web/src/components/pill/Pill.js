import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconSave } from 'assets/img/iconSave.svg'

import styles from './Pill.module.css'

const icons = {
  types: ['save'],
  save: <IconSave />
}

const Pill = (props) => {
  const onClick = () => {
    if (props.clickable) {
      props.onClick()
    }
  }
  return (
    <div
      className={cn(styles.pill, props.className, {
        [styles.clickable]: props.clickable
      })}
      onClick={onClick}
    >
      {props.showIcon ? (
        <div className={styles.icon}>{icons[props.icon]}</div>
      ) : null}
      <div className={cn(styles.text, props.textClassName)}>{props.text}</div>
    </div>
  )
}

Pill.propTypes = {
  className: PropTypes.string,
  textClassName: PropTypes.string,
  text: PropTypes.string,
  showIcon: PropTypes.bool,
  icon: PropTypes.oneOf(icons.types),
  clickable: PropTypes.bool,
  onClick: PropTypes.func
}

Pill.defaultProps = {
  text: 'New',
  showIcon: true,
  icon: 'save',
  clickable: true,
  onClick: () => {}
}

export default Pill
