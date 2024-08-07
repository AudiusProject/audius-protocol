import type { Meta, StoryObj } from '@storybook/react'

import {
  IconHeart,
  IconPin,
  IconStar,
  IconTipping,
  IconTrophy
} from '@audius/harmony-native'

import { Divider, Flex } from '../..'

import { IconText } from './IconText'

const meta: Meta<typeof IconText> = {
  title: 'Components/Comments/IconText [beta]',
  component: IconText
}

export default meta

type Story = StoryObj<typeof IconText>

export const Default: Story = {
  render: () => (
    <Flex direction='column' gap='l' p='s'>
      <IconText text='Test Text' />
      <IconText text='Test Text' color='accent' />
      <IconText text='Test Text' color='active' />

      <Divider />

      <IconText icons={[{ icon: IconPin }]} text='Pinned By Artist' />
      <IconText
        icons={[{ icon: IconHeart, color: 'active' }]}
        text='Liked By Artist'
      />
      <IconText
        icons={[{ icon: IconPin }, { icon: IconHeart, color: 'active' }]}
        text='Liked By Artist'
      />

      <Divider />

      <IconText
        icons={[{ icon: IconTrophy, color: 'accent' }]}
        text='Top Supporter'
        color='accent'
      />
      <IconText
        icons={[{ icon: IconTipping, color: 'accent' }]}
        text='Tip Supporter'
        color='accent'
      />
      <IconText
        icons={[{ icon: IconStar, color: 'accent' }]}
        text='Artist'
        color='accent'
      />
    </Flex>
  )
}
