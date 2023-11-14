import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { Popup } from './Popup'
import type { PopupProps } from './types'
import { Button } from 'components/button'
import { Text } from 'components/text'
import { Paper } from '../Paper'

const meta: Meta<typeof Popup> = {
  title: 'Layout/Popup [beta]',
  component: Popup,
  parameters: {
    controls: {
      include: [
        'anchorRef',
        'isVisible',
        'anchorOrigin',
        'transformOrigin',
        'dismissOnMouseLeave',
        'showHeader',
        'title',
        'hideCloseButton',
        'zIndex',
        'containerRef',
        'onClose',
        'onAfterClose',
        'checkIfClickInside',
      ]
    }
  },
  render: (props: PopupProps) => {
    const anchorRef = useRef<HTMLButtonElement | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    
    return (
      <Button
        ref={anchorRef}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Text>Click Me</Text>
        <Popup
          {...props}
          anchorRef={anchorRef}
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
        >
          <Paper>
            <Text>Popup Content</Text>
          </Paper>
        </Popup>
      </Button>
    )
  }
}

export default meta

type Story = StoryObj<typeof Popup>

export const Default: Story = { args: {} }
