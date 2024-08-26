import type { Meta, StoryObj } from '@storybook/react'

import { Select } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  args: {
    label: 'Select Label',
    placeholder: 'Select Placeholder',
    options: [
      { value: 'Red Rover' },
      { value: 'Green Goblin' },
      { value: 'Blue Man Group' }
    ]
  }
}

export default meta

type Story = StoryObj<typeof Select>

export const Primary: Story = {
  render: (props) => <Select {...props} />
}

export const AssistiveText: Story = {
  render: (props) => <Select {...props} helperText='This is assitive text' />
}
