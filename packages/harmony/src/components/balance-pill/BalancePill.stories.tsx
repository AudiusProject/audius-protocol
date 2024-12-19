import type { Meta, StoryObj } from '@storybook/react'

import { BalancePill } from './BalancePill'

const meta: Meta<typeof BalancePill> = {
  title: 'Components/BalancePill',
  component: BalancePill,
  parameters: {
    design: {
      type: 'figma',
      url: '' // Add your Figma URL here
    }
  },
  tags: ['autodocs']
}

export default meta

type Story = StoryObj<typeof BalancePill>

export const Default: Story = {
  args: {
    balance: 125
  }
}
