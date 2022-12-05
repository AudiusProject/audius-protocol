import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import TwitterButton, {
  TwitterButtonProps
} from '../twitter-button/TwitterButton'

import TwitterAuth, { TwitterAuthProps } from './TwitterAuth'

type TwitterAuthButtonProps = TwitterButtonProps &
  Omit<TwitterAuthProps, 'requestTokenUrl' | 'loginUrl'>

const TwitterAuthButton = (props: TwitterAuthButtonProps) => {
  const { onClick, onFailure, onSuccess } = props
  return (
    <TwitterAuth
      forceLogin
      onClick={onClick}
      onFailure={onFailure}
      onSuccess={onSuccess}
      requestTokenUrl={`${audiusBackendInstance.identityServiceUrl}/twitter`}
      loginUrl={`${audiusBackendInstance.identityServiceUrl}/twitter/callback`}
    >
      <TwitterButton {...props} />
    </TwitterAuth>
  )
}

export default TwitterAuthButton
