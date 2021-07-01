import React, { useState } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconHeart } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import styles from './FavoriteButton.module.css'

const FavoriteButton = props => {
  const [isHovered, setIsHovered] = useState(false)

  let icon
  if (props.favorited && !isHovered) {
    icon = (
      <>
        <IconHeart
          className={cn(
            styles.icon,
            styles.heart,
            styles.favorited,
            styles.hoverOut,
            props.favoritedClassName
          )}
        />
        <IconRemove
          className={cn(styles.icon, styles.remove, props.unfavoritedClassName)}
        />
      </>
    )
  } else if (props.favorited) {
    icon = (
      <IconHeart
        onMouseEnter={() => setIsHovered(false)}
        className={cn(
          styles.icon,
          styles.heart,
          styles.favorited,
          props.favoritedClassName
        )}
      />
    )
  } else {
    icon = (
      <IconHeart
        onMouseEnter={() => setIsHovered(true)}
        className={cn(styles.icon, styles.heart, props.unfavoritedClassName)}
      />
    )
  }
  return (
    <div
      onClick={!props.disabled ? props.onClick : null}
      className={cn(styles.favoriteButton, props.className, {
        [styles.disabled]: props.disabled
      })}
    >
      {icon}
    </div>
  )
}

FavoriteButton.propTypes = {
  className: PropTypes.string,
  favoritedClassName: PropTypes.string,
  unfavoritedClassName: PropTypes.string,
  favorited: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
}

FavoriteButton.defaultProps = {
  favorited: true
}

export default FavoriteButton
