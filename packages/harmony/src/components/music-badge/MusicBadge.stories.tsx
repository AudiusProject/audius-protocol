import type { Meta, StoryObj } from '@storybook/react'

import { MusicBadge } from './MusicBadge'

const meta: Meta<typeof MusicBadge> = {
  title: 'Components/MusicBadge',
  component: MusicBadge
}

export default meta

type Story = StoryObj<typeof MusicBadge>

export const Default: Story = {
  args: { textLabel: 'Badge text' }
}
