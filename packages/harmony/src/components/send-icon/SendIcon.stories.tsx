import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'

import { SendIcon } from './SendIcon'

const meta: Meta<typeof SendIcon> = {
  title: 'Components/Comments/SendIcon [beta]',
  component: SendIcon
}

export default meta

type Story = StoryObj<typeof SendIcon>

export const Default: Story = {
  render: () => (
    <Flex direction='column' gap='l' p='s'>
      <SendIcon />
      <SendIcon disabled />
    </Flex>
  )
}
