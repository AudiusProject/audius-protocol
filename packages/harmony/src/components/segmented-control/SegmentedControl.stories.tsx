import { Meta, StoryObj } from '@storybook/react'

import { SegmentedControl } from './SegmentedControl'
import { Option } from './types'

const options: Option<string>[] = [
  {
    key: 'a',
    text: 'Long Option A'
  },
  {
    key: 'b',
    text: 'Option B'
  },
  {
    key: 'c',
    text: 'Really Long Option C'
  },
  {
    key: 'd',
    text: 'Option D'
  }
]

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    options
  }
}

export default meta

type Story = StoryObj<typeof SegmentedControl>

export const Primary: Story = {
  render: (props) => <SegmentedControl {...props} />
}

export const FullWidth: Story = {
  render: (props) => <SegmentedControl {...props} fullWidth />
}

export const EqualWidth: Story = {
  render: (props) => <SegmentedControl {...props} equalWidth />
}

export const IsMobile: Story = {
  render: (props) => <SegmentedControl {...props} isMobile />
}
