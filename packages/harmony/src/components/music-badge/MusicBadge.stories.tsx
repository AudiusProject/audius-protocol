import type { Meta, StoryObj } from '@storybook/react'

import IconRobot from '~harmony/assets/icons/Robot.svg'

import { MusicBadge } from './MusicBadge'

const meta: Meta<typeof MusicBadge> = {
  title: 'Components/MusicBadge',
  component: MusicBadge
}

export default meta

type Story = StoryObj<typeof MusicBadge>

export const Default: Story = {
  args: {
    icon: IconRobot,
    children: 'Example Badge'
  }
}
