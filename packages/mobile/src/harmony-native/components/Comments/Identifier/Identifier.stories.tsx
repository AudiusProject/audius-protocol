import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from '../..'

import { Identifier } from './Identifier'

const meta: Meta<typeof Identifier> = {
  title: 'Components/Comments/Identifier [beta]',
  component: Identifier
}

export default meta

type Story = StoryObj<typeof Identifier>

export const Default: Story = {
  render: () => (
    <Flex direction='column' gap='l' p='s'>
      <Identifier type='artist' />
      <Identifier type='supporter' />
      <Identifier type='topSupporter' />
    </Flex>
  )
}
