import type { Meta, StoryObj } from '@storybook/react'

import { IconButton } from 'components/button'
import { IconAudiusLogo } from 'icons'

import { Flex } from '../layout/Flex'

import { NotificationCount } from './NotificationCount'

const meta: Meta<typeof NotificationCount> = {
  title: 'Components/NotificationCount',
  component: NotificationCount
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
    <Flex>
      <IconButton icon={IconAudiusLogo} aria-label='Notifications' />
      <NotificationCount count={3} />
    </Flex>
  )
}

export const LargeNumber: Story = {
  render: () => (
    <Flex>
      <IconButton icon={IconAudiusLogo} aria-label='Notifications' />
      <NotificationCount count={99} />
    </Flex>
  )
}
