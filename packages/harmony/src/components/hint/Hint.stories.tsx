import type { Meta, StoryObj } from '@storybook/react'

import { IconError } from '~harmony/icons'

import { Hint } from './Hint'

const meta: Meta<typeof Hint> = {
  title: 'Components/Hint [beta]',
  component: Hint
}

export default meta

type Story = StoryObj<typeof Hint>

export const Default: Story = {
  args: {
    icon: IconError,
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio'
  }
}
