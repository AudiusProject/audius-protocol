import React, { useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconFollow,
  IconFollowing,
  IconUnfollow
} from '@audius/stems'

import styles from './FollowButton.module.css'

const messages = {
  follow: 'FOLLOW',
  following: 'FOLLOWING',
  unfollow: 'UNFOLLOW'
}

const FollowButton = props => {
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)

  const style = {
    [styles.noIcon]: !props.showIcon,
    [styles.medium]: props.size === 'medium',
    [styles.small]: props.size === 'small'
  }
  const { following, onUnfollow, onFollow } = props

  const onClick = useCallback(() => {
    if (following) onUnfollow()
    else onFollow()
    setIsHoveringClicked(true)
  }, [following, onUnfollow, onFollow, setIsHoveringClicked])

  useEffect(() => {
    if (!isHovering && isHoveringClicked) setIsHoveringClicked(false)
  }, [isHovering, isHoveringClicked, setIsHoveringClicked])

  const buttonType =
    !props.following &&
    !isHovering &&
    !isHoveringClicked &&
    !props.invertedColor
      ? ButtonType.SECONDARY
      : ButtonType.PRIMARY_ALT

  let icon
  let text
  if (!props.following && !isHoveringClicked) {
    icon = <IconFollow />
    text = messages.follow
  } else if (props.following && isHoveringClicked) {
    icon = <IconFollowing />
    text = messages.following
  } else if (props.following && !isHovering) {
    text = messages.following
    icon = <IconFollowing />
  } else if (props.following && isHovering) {
    icon = <IconUnfollow />
    text = messages.unfollow
  } else if (!props.following && isHoveringClicked) {
    icon = <IconFollow />
    text = messages.follow
  }

  if (!props.showIcon) icon = null

  return (
    <Button
      className={cn(styles.followButton, props.className, style)}
      textClassName={styles.followButtonText}
      iconClassName={styles.followButtonIcon}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      size={ButtonSize.SMALL}
      type={buttonType}
      text={text}
      leftIcon={icon}
      widthToHideText={props.widthToHideText}
    />
  )
}

FollowButton.propTypes = {
  invertedColor: PropTypes.bool,
  showIcon: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  widthToHideText: PropTypes.number,
  className: PropTypes.string,
  following: PropTypes.bool,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func
}

FollowButton.defaultProps = {
  invertedColor: false,
  following: false,
  showIcon: true,
  size: 'medium'
}

export default FollowButton
