import type { Meta, StoryObj } from '@storybook/react'

import { Skeleton } from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton
}

export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: {
    w: 200,
    h: 200
  }
}
