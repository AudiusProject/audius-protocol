import cn from 'classnames'

import styles from './Button.module.css'

const Button = ({ onClick, icon, label, className, disabled }) => {
  const wrappedOnClick = () => {
    !disabled && onClick()
  }

  return (
    <div
      className={cn(
        styles.container,
        { [styles.disabled]: disabled },
        className
      )}
      onClick={wrappedOnClick}
    >
      {label && <div>{label}</div>}
      {icon}
    </div>
  )
}

export default Button
