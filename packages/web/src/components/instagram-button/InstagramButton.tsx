import { Button, ButtonType, ButtonSize } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconInstagram } from 'assets/img/iconInstagram.svg'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import InstagramAuth from '../instagram-auth/InstagramAuth'

import styles from './InstagramButton.module.css'

type InstagramAuthButtonProps = {
  onSuccess?: (uuid: string, profile: any) => void
  onFailure?: (error: any) => void
  style?: object
  disabled?: boolean
  /**
   * Whether or not the success of this instagram auth
   * depends on fetching metadata or not.
   * Generally speaking, fetching metadata is not reliable,
   * so if the purpose of this auth is just verification
   * that the user has OAuthed, not to pull specific data,
   * set this flag to false.
   * Without metadata, instagram gives you very few fields:
   * https://developers.facebook.com/docs/instagram-basic-display-api/reference/user
   */
  requiresProfileMetadata?: boolean
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
  text,
  requiresProfileMetadata = true
}: InstagramAuthButtonProps) => {
  return (
    <InstagramAuth
      onClick={onClick}
      disabled={disabled}
      onFailure={onFailure || (() => {})}
      onSuccess={onSuccess || (() => {})}
      getUserUrl={`${audiusBackendInstance.identityServiceUrl}/instagram`}
      setProfileUrl={`${audiusBackendInstance.identityServiceUrl}/instagram/profile`}
      requiresProfileMetadata={requiresProfileMetadata}
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
