import { ReactElement } from 'react'

import { TransitionContainer } from './TransitionContainer'

const DEFAULT_DURATION = 500

type OpacityTransitionProps = {
  render: (item: any, style: object) => ReactElement
  item?: any
  duration?: number
}
export const OpacityTransition = ({
  render,
  item = null,
  duration = DEFAULT_DURATION
}: OpacityTransitionProps) => {
  return (
    <TransitionContainer
      render={render}
      item={item}
      fromStyles={{ opacity: 0 }}
      enterStyles={{ opacity: 1 }}
      leaveStyles={{ opacity: 0 }}
      config={{ duration }}
    />
  )
}
