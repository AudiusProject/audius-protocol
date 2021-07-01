import React from 'react'

import { FeatureFlags } from 'services/remote-config'

import { useFlag } from './hooks'

type FeatureFlagProps = {
  /* The feature to enable/disable. */
  flag: FeatureFlags

  /* Invert the flag test - if inverted && flag is true, do *not* render the component. */
  inverted?: boolean

  children?: React.ReactNode
}

/* FeatureFlag renders children only if the `flag` prop evaluates to true,
 * otherwise returning null.
 */
const FeatureFlag = ({ flag, inverted, children }: FeatureFlagProps) => {
  const { isEnabled } = useFlag(flag)
  const shouldRender = inverted ? !isEnabled : isEnabled
  return <> {shouldRender ? children : null}</>
}

export default FeatureFlag
