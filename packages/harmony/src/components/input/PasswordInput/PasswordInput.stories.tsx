import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { PasswordInput } from './PasswordInput'
import type { PasswordInputProps } from './types'

const StoryRender = (props: PasswordInputProps) => {
  const [value, setValue] = useState(props.value)
  return (
    <PasswordInput
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
      }}
    />
  )
}

const meta: Meta<typeof PasswordInput> = {
  title: 'Inputs/PasswordInput',
  component: PasswordInput,
  parameters: {
    docs: {
      controls: {
        exclude: ['inputRef', 'inputRootClassName', 'inputClassName']
      }
    }
  },
  render: StoryRender
}

export default meta

type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: {
    label: 'Password'
  }
}

export const NoVisibilityToggle: Story = {
  args: {
    label: 'Password',
    hideVisibilityToggle: true
  }
}
