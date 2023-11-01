import type { Meta, StoryObj } from '@storybook/react'

import { IconHeart } from 'components/icon'

import { SelectablePill } from './SelectablePill'

const meta: Meta<typeof SelectablePill> = {
  title: 'Components/Input/SelectablePill',
  component: SelectablePill
}

export default meta

type Story = StoryObj<typeof SelectablePill>

export const Default: Story = {
  args: {
    label: 'Option'
  }
}

export const Large: Story = {
  args: {
    label: 'Option',
    size: 'large'
  }
}

export const WithIcon: Story = {
  args: {
    label: 'Option',
    icon: IconHeart
  }
}

export const LargeWithIcon: Story = {
  args: {
    label: 'Option',
    size: 'large',
    icon: IconHeart
  }
}
