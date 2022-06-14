import { Story } from '@storybook/react'

import { ProgressBar } from './ProgressBar'
import { ProgressBarProps } from './types'

export default {
  component: ProgressBar,
  title: 'Components/ProgressBar',
  argTypes: {}
}

const Template: Story<ProgressBarProps> = args => <ProgressBar {...args} />

// Primary
export const Primary = Template.bind({})
const primaryProps: ProgressBarProps = {
  min: 0,
  max: 10,
  value: 3
  // minWrapper: ({ value }) => <span>{value} $AUDIO</span>,
  // maxWrapper: ({ value }) => <span>{value} $AUDIO</span>
}

Primary.args = primaryProps
