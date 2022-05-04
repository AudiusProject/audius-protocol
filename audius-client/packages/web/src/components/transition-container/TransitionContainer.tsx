import React, { ReactNode } from 'react'

import { animated, Transition } from 'react-spring/renderprops'

type TransitionContainerProps<T> = {
  children: ReactNode
  item: T
  fromStyles: object
  enterStyles: object
  leaveStyles: object
  config: object
  additionalStyles?: object
}

export function TransitionContainer<T>({
  children,
  item,
  fromStyles,
  enterStyles,
  leaveStyles,
  config,
  additionalStyles
}: TransitionContainerProps<T>) {
  return (
    <Transition
      items={item}
      unique
      from={fromStyles}
      enter={enterStyles}
      leave={leaveStyles}
      config={config}
    >
      {item => props => (
        <animated.div style={{ ...props, ...additionalStyles }}>
          {children}
        </animated.div>
      )}
    </Transition>
  )
}
