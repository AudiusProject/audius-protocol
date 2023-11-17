import type { Meta, StoryObj } from '@storybook/react'

import { Paper } from './Paper'

const meta: Meta<typeof Paper> = {
  title: 'Layout/Paper',
  component: Paper,
  parameters: {
    controls: {
      include: ['w', 'h', 'backgroundColor', 'border', 'borderRadius', 'shadow']
    }
  }
}

export default meta

type Story = StoryObj<typeof Paper>

export const Default: Story = {
  args: {
    w: 248,
    h: 84
  }
}
