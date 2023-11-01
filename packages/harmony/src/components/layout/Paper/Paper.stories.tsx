import type { Meta, StoryObj } from '@storybook/react'

import { Paper } from './Paper'

const meta: Meta<typeof Paper> = {
  title: 'Components/Layout/Paper',
  component: Paper
}

export default meta

type Story = StoryObj<typeof Paper>

export const Default: Story = {
  args: {
    w: 248,
    h: 84,
    backgroundColor: 'white'
  }
}
