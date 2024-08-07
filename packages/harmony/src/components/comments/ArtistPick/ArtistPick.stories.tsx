import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'

import { ArtistPick } from './ArtistPick'

const meta: Meta<typeof ArtistPick> = {
  title: 'Components/Comments/ArtistPick [beta]',
  component: ArtistPick
}

export default meta

type Story = StoryObj<typeof ArtistPick>

export const Default: Story = {
  render: () => (
    <Flex direction='column' gap='l' p='s'>
      <ArtistPick isPinned />
      <ArtistPick isLiked />
      <ArtistPick isPinned isLiked />
    </Flex>
  )
}
