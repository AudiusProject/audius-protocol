import type { Meta, StoryObj } from '@storybook/react'

import { IconSearch, IconVisibilityHidden } from '../../typography'

import { TextInput, TextInputSize } from './TextInput'

const meta: Meta<typeof TextInput> = {
  title: 'Components/Input/TextInput',
  component: TextInput,
  parameters: {
    docs: {
      controls: {
        exclude: ['inputRef', 'inputRootClassName', 'inputClassName']
      }
    }
  }
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
    showMaxLength: true,
    value: 'Flying a little close to the character limit there bud 🦅',
    error: true
  }
}
