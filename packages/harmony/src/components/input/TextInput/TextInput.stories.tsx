import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { IconSearch, IconVisibilityHidden } from 'icons'

import { TextInput } from './TextInput'
import { TextInputProps, TextInputSize } from './types'

const StoryRender = (props: TextInputProps) => {
  const [value, setValue] = useState(props.value)
  return (
    <TextInput
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
      }}
    />
  )
}

const meta: Meta<typeof TextInput> = {
  title: 'Inputs/TextInput',
  component: TextInput,
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

type Story = StoryObj<typeof TextInput>

export const Default: Story = {
  args: {
    label: 'Input Label',
    helperText: 'This is assistive text.',
    placeholder: 'Placeholder'
  }
}

export const Small: Story = {
  args: {
    label: 'Input Label',
    size: TextInputSize.SMALL,
    helperText: 'This is assistive text.',
    placeholder: 'Placeholder',
    startIcon: IconSearch
  }
}

export const TextAdornments: Story = {
  args: {
    label: 'Input Label',
    helperText: 'This is assistive text.',
    placeholder: 'Enter an amount',
    startAdornmentText: '@',
    endAdornmentText: '$AUDIO'
  }
}

export const Icons: Story = {
  args: {
    label: 'Input Label',
    helperText: 'This is assistive text.',
    placeholder: 'Your handle',
    startIcon: IconSearch,
    endIcon: IconVisibilityHidden
  }
}

export const MaxCharacters: Story = {
  args: {
    label: 'Input Label',
    helperText: 'This is assistive text.',
    placeholder: 'Your handle',
    maxLength: 60,
    value: 'Flying a little close to the character limit there bud 🦅'
  }
}

export const Disabled: Story = {
  args: {
    label: 'Input Label',
    helperText: 'This is assistive text.',
    disabled: true,
    value: "You couldn't change me if you tried"
  }
}
