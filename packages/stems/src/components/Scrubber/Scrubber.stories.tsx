import React from 'react'

import { Story } from '@storybook/react'

import { Scrubber } from './Scrubber'
import { ScrubberProps } from './types'

export default {
  component: Scrubber,
  title: 'Components/Scrubber'
}

const Template: Story<ScrubberProps> = args => <Scrubber {...args} />

// Primary
export const Primary = Template.bind({})
const primaryProps: ScrubberProps = {
  isPlaying: false,
  mediaKey: '1',
  elapsedSeconds: 0,
  totalSeconds: 100
}

Primary.args = primaryProps
