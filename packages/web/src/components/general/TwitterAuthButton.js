import React from 'react'

import PropTypes from 'prop-types'

import { IDENTITY_SERVICE } from 'services/AudiusBackend'

import TwitterAuth from './TwitterAuth'
import TwitterButton from './TwitterButton'

const TwitterAuthButton = props => {
  return (
    <TwitterAuth
      forceLogin
      onClick={props.onClick}
      disabled={props.disabled}
      onFailure={props.onFailure}
      onSuccess={props.onSuccess}
      requestTokenUrl={`${IDENTITY_SERVICE}/twitter`}
      loginUrl={`${IDENTITY_SERVICE}/twitter/callback`}
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
