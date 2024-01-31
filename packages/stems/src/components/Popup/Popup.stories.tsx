import { useRef, useState } from 'react'

import { Story } from '@storybook/react'

import { Button } from 'components/Button'

import { Popup } from './Popup'
import { PopupProps } from './types'

export default {
  component: Popup,
  title: 'Components/Popup'
}

const Template: Story<PopupProps> = (args) => {
  const anchorRef = useRef<HTMLButtonElement | null>(null)
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
          if (target instanceof Element && anchorRef?.current) {
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
export const Primary: any = Template.bind({})
const primaryProps: Omit<
  PopupProps,
  'children' | 'anchorRef' | 'isVisible' | 'onClose'
> = {}

Primary.args = primaryProps

// With Header
export const WithHeader: any = Template.bind({})
const withHeaderProps: Omit<
  PopupProps,
  'children' | 'anchorRef' | 'isVisible' | 'onClose'
> = {
  showHeader: true,
  title: 'My Title'
}

WithHeader.args = withHeaderProps
