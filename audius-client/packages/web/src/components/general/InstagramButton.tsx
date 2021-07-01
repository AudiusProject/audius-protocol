import React from 'react'

import { Button, ButtonType, ButtonSize } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconInstagram } from 'assets/img/iconInstagram.svg'
import { IDENTITY_SERVICE } from 'services/AudiusBackend'

import InstagramAuth from './InstagramAuth'
import styles from './InstagramButton.module.css'

type InstagramAuthButtonProps = {
  onSuccess?: (uuid: string, profile: any) => void
  onFailure?: (error: any) => void
  style?: object
  disabled?: boolean
} & InstagramButtonProps

type InstagramButtonProps = {
  text?: string
  textClassName?: string
  iconClassName?: string
  onClick?: () => void
  className?: string
}

export const InstagramButton = ({
  text,
  className,
  onClick,
  textClassName,
  iconClassName
}: InstagramButtonProps) => {
  return (
    <Button
      type={ButtonType.PRIMARY_ALT}
      leftIcon={<IconInstagram className={styles.icon} />}
      className={cn(styles.button, { [className!]: !!className })}
      textClassName={cn(styles.text, { [textClassName!]: !!textClassName })}
      iconClassName={cn(styles.icon, { [iconClassName!]: !!iconClassName })}
      size={ButtonSize.MEDIUM}
      text={text}
      onClick={onClick ?? (() => {})}
    />
  )
}
const InstagramAuthButton = ({
  className,
  textClassName,
  iconClassName,
  onClick = () => {},
  onSuccess,
  onFailure,
  disabled = false,
  text
}: InstagramAuthButtonProps) => {
  return (
    <InstagramAuth
      onClick={onClick}
      disabled={disabled}
      onFailure={onFailure || (() => {})}
      onSuccess={onSuccess || (() => {})}
      getUserUrl={`${IDENTITY_SERVICE}/instagram`}
      setProfileUrl={`${IDENTITY_SERVICE}/instagram/profile`}
    >
      <InstagramButton
        className={className}
        textClassName={textClassName}
        iconClassName={iconClassName}
        text={text}
      />
    </InstagramAuth>
  )
}

export default InstagramAuthButton
