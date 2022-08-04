import PropTypes from 'prop-types'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import TwitterButton from '../twitter-button/TwitterButton'

import TwitterAuth from './TwitterAuth'

const TwitterAuthButton = (props) => {
  return (
    <TwitterAuth
      forceLogin
      onClick={props.onClick}
      disabled={props.disabled}
      onFailure={props.onFailure}
      onSuccess={props.onSuccess}
      requestTokenUrl={`${audiusBackendInstance.identityServiceUrl}/twitter`}
      loginUrl={`${audiusBackendInstance.identityServiceUrl}/twitter/callback`}
    >
      <TwitterButton {...props} />
    </TwitterAuth>
  )
}

TwitterAuthButton.propTypes = {
  isMobile: PropTypes.bool,
  textLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  className: PropTypes.string,
  style: PropTypes.object,
  size: PropTypes.oneOf(['tiny', 'small', 'medium']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool
}

TwitterAuthButton.defaultProps = {
  isMobile: false,
  disabled: false,
  textLabel: 'Button',
  size: 'medium',
  onClick: () => {}
}

export default TwitterAuthButton
