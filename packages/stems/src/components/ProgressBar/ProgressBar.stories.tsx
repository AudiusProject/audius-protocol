import { Story } from '@storybook/react'

import { ProgressBar } from './ProgressBar'
import { ProgressBarProps } from './types'

export default {
  component: ProgressBar,
  title: 'Components/ProgressBar',
  argTypes: {}
}

const Template: Story<ProgressBarProps> = (args) => <ProgressBar {...args} />
const baseProps: ProgressBarProps = {
  min: 0,
  max: 10,
  value: 3
}

// Primary
export const Primary: any = Template.bind({})
Primary.args = { ...baseProps }

// With Labels
export const WithLabels: any = Template.bind({})
WithLabels.args = { ...baseProps, showLabels: true }

// With Label Wrappers
export const WithLabelWrappers: any = Template.bind({})
WithLabelWrappers.args = {
  ...baseProps,
  showLabels: true,
  minWrapper: ({ value }: { value: number }) => (
    <span>{value.toString()} $AUDIO</span>
  ),
  maxWrapper: ({ value }: { value: number }) => (
    <span>{value.toString()} $AUDIO</span>
  )
}
