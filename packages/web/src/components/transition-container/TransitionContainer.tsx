import { ReactElement } from 'react'

// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated, Transition } from 'react-spring/renderprops.cjs'

type TransitionContainerProps<T> = {
  render: (item: any, style: object) => ReactElement
  item: T
  fromStyles: object
  enterStyles: object
  leaveStyles: object
  config: object
  additionalStyles?: object
}

export function TransitionContainer<T>({
  render,
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
      {(item) => (style) => (
        <animated.div style={{ ...style, ...additionalStyles }}>
          {render(item, style)}
        </animated.div>
      )}
    </Transition>
  )
}
