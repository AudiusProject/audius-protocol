import type { Meta, StoryObj } from '@storybook/react'

import { Divider, Flex } from 'components/layout'
import { IconHeart, IconPin, IconStar, IconTipping, IconTrophy } from 'icons'

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
      <IconText>Test Text</IconText>
      <IconText color='accent'>Test Text</IconText>
      <IconText color='active'>Test Text</IconText>

      <Divider />

      <IconText icons={[{ icon: IconPin }]}> Pinned By Artist </IconText>
      <IconText icons={[{ icon: IconHeart, color: 'active' }]}>
        Liked By Artist
      </IconText>
      <IconText
        icons={[{ icon: IconPin }, { icon: IconHeart, color: 'active' }]}
      >
        Liked By Artist
      </IconText>

      <Divider />

      <IconText icons={[{ icon: IconTrophy, color: 'accent' }]} color='accent'>
        Top Supporter
      </IconText>
      <IconText icons={[{ icon: IconTipping, color: 'accent' }]} color='accent'>
        Tip Supporter
      </IconText>
      <IconText icons={[{ icon: IconStar, color: 'accent' }]} color='accent'>
        Artist
      </IconText>
    </Flex>
  )
}
