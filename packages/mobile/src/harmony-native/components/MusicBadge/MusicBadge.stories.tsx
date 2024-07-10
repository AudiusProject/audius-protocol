import type { Meta, StoryObj } from '@storybook/react'

import { IconRobot } from '@audius/harmony-native'

import type { MusicBadgeProps } from './MusicBadge'
import { MusicBadge } from './MusicBadge'

const meta: Meta<MusicBadgeProps> = {
  title: 'Components/MusicBadge',
  component: MusicBadge,
  argTypes: {
    variant: {
      description: 'Variant',
      control: { type: 'radio' },
      options: ['default', 'accent']
    },
    color: {
      description: 'Color',
      control: { type: 'radio' },
      options: ['aiGreen', 'trendingBlue']
    }
  },
  render: (props) => <MusicBadge {...props} />
}

export default meta

type Story = StoryObj<MusicBadgeProps>

export const Default: Story = {
  args: {
    icon: IconRobot,
    children: 'Example Badge'
  }
}

export const Accent: Story = {
  args: {
    variant: 'accent',
    icon: IconRobot,
    children: 'Example Badge'
  }
}

export const Color: Story = {
  args: {
    color: 'aiGreen',
    icon: IconRobot,
    children: 'Example Badge'
  }
}
