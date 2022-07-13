import { useState, useCallback, useEffect } from 'react'

import {
  Button,
  ButtonSize,
  ButtonType,
  IconFollow,
  IconFollowing,
  IconUnfollow
} from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './FollowButton.module.css'

const messages = {
  follow: 'Follow',
  following: 'Following',
  unfollow: 'Unfollow'
}

const FollowButton = (props) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)

  const style = {
    [styles.noIcon]: !props.showIcon,
    [styles.full]: props.size === 'full',
    [styles.medium]: props.size === 'medium',
    [styles.small]: props.size === 'small'
  }
  const { following, onUnfollow, onFollow, isDisabled, stopPropagation } = props

  const onClick = useCallback(
    (e) => {
      if (following) {
        onUnfollow()
      } else {
        onFollow()
      }
      setIsHoveringClicked(true)
      if (stopPropagation) {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
      }
    },
    [following, onUnfollow, onFollow, setIsHoveringClicked, stopPropagation]
  )

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
    icon = <IconFollow width={18} height={18} />
    text = props.messages.follow
  } else if (props.following && isHoveringClicked) {
    icon = <IconFollowing width={18} height={18} />
    text = props.messages.following
  } else if (props.following && !isHovering) {
    text = props.messages.following
    icon = <IconFollowing width={18} height={18} />
  } else if (props.following && isHovering) {
    icon = <IconUnfollow width={18} height={18} />
    text = props.messages.unfollow
  } else if (!props.following && isHoveringClicked) {
    icon = <IconFollow width={18} height={18} />
    text = props.messages.follow
  }

  if (!props.showIcon) icon = null

  return (
    <Button
      isDisabled={isDisabled}
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
  messages: PropTypes.shape({
    follow: PropTypes.string.isRequired,
    following: PropTypes.string.isRequired,
    unfollow: PropTypes.string.isRequired
  }),
  invertedColor: PropTypes.bool,
  showIcon: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'full']),
  widthToHideText: PropTypes.number,
  className: PropTypes.string,
  following: PropTypes.bool,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  isDisabled: PropTypes.bool,
  stopPropagation: PropTypes.bool
}

FollowButton.defaultProps = {
  invertedColor: false,
  following: false,
  showIcon: true,
  size: 'medium',
  messages,
  isDisabled: false,
  stopPropagation: false
}

export default FollowButton
