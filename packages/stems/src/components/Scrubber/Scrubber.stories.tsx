import { Story } from '@storybook/react'

import { Scrubber } from './Scrubber'
import { ScrubberProps } from './types'

export default {
  component: Scrubber,
  title: 'Components/Scrubber'
}

const Template: Story<ScrubberProps> = (args) => <Scrubber {...args} />
const baseProps: Partial<ScrubberProps> = {
  isPlaying: false,
  mediaKey: '1',
  elapsedSeconds: 0,
  totalSeconds: 100
}

// Primary
export const Primary: any = Template.bind({})
Primary.args = { ...baseProps }

// Disabled
export const Disabled: any = Template.bind({})
Disabled.args = { ...baseProps, isDisabled: true }

// No Timestamps
export const NoTimestamps: any = Template.bind({})
NoTimestamps.args = { ...baseProps, includeTimestamps: false }

// Mobile
export const Mobile: any = Template.bind({})
Mobile.args = { ...baseProps, isMobile: true }
