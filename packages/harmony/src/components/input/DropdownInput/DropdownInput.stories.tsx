import type { Meta, StoryObj } from '@storybook/react'

import { DropdownInput } from './DropdownInput'

const meta: Meta<typeof DropdownInput> = {
  title: 'Components/DropdownInput',
  component: DropdownInput,
  args: {
    label: 'DropdownInput Label',
    placeholder: 'Select an option',
    options: [
      { value: 'Red Rover' },
      { value: 'Green Goblin' },
      { value: 'Blue Man Group' }
    ]
  }
}

export default meta

type Story = StoryObj<typeof DropdownInput>

export const Primary: Story = {
  render: (props) => <DropdownInput {...props} />
}

export const AssistiveText: Story = {
  render: (props) => <DropdownInput {...props} helperText='This is assistive text' />
}

export const WithIcons: Story = {
  render: (props) => (
    <DropdownInput
      {...props}
      options={[
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' }
      ]}
    />
  )
}

export const Clearable: Story = {
  render: (props) => <DropdownInput {...props} clearable />
}
