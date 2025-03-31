import type { Meta, StoryObj } from '@storybook/react'

import { IconButton } from '~harmony/components/button'
import { IconNotificationOn } from '~harmony/icons'

import { NotificationCount } from './NotificationCount'

const meta: Meta<typeof NotificationCount> = {
  title: 'Components/NotificationCount',
  component: NotificationCount,
  parameters: {
    layout: 'centered'
  }
}

export default meta

type Story = StoryObj<typeof NotificationCount>

export const Default: Story = {
  args: {
    count: 5
  }
}

export const WithIcon: Story = {
  render: () => (
    <NotificationCount count={3}>
      <IconButton icon={IconNotificationOn} aria-label='Notifications' />
    </NotificationCount>
  )
}

export const SmallSize: Story = {
  render: () => (
    <NotificationCount count={3} size='s'>
      <IconButton icon={IconNotificationOn} aria-label='Notifications' />
    </NotificationCount>
  )
}

export const LargeNumber: Story = {
  render: () => (
    <NotificationCount count={15000}>
      <IconButton icon={IconNotificationOn} aria-label='Notifications' />
    </NotificationCount>
  )
}
