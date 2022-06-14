import { useRef, useState } from 'react'

import { Story } from '@storybook/react'

import { Button } from 'components/Button'

import { Popup } from './Popup'
import { PopupProps } from './types'

export default {
  component: Popup,
  title: 'Components/Popup'
}

const Template: Story<PopupProps> = args => {
  const anchorRef = useRef<HTMLButtonElement>()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <>
      <Button
        text='Click me'
        ref={anchorRef}
        onClick={() => setIsVisible(!isVisible)}
      />
      <Popup
        {...args}
        anchorRef={anchorRef}
        isVisible={isVisible}
        checkIfClickInside={(target: EventTarget) => {
          if (target instanceof Element && anchorRef) {
            return anchorRef.current.contains(target)
          }
          return false
        }}
        onClose={() => setIsVisible(false)}
      >
        Popup content
      </Popup>
    </>
  )
}

// Primary
export const Primary = Template.bind({})
const primaryProps: Omit<
  PopupProps,
  'children' | 'anchorRef' | 'isVisible'
> = {}

Primary.args = primaryProps

// With Header
export const WithHeader = Template.bind({})
const withHeaderProps: Omit<
  PopupProps,
  'children' | 'anchorRef' | 'isVisible'
> = {
  showHeader: true,
  title: 'My Title'
}

WithHeader.args = withHeaderProps
