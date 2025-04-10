import type { Meta, StoryObj } from '@storybook/react'

import { Text, Flex } from '..'
import { IconInfo } from '../../icons'

import { FlairHoverCard } from './FlairHoverCard'

const meta: Meta<typeof FlairHoverCard> = {
  title: 'Components/FlairHoverCard',
  component: FlairHoverCard,
  parameters: {
    layout: 'centered'
  }
}

export default meta
type Story = StoryObj<typeof FlairHoverCard>

export const Default: Story = {
  args: {
    children: (
      <Flex alignItems='center' gap='s'>
        <IconInfo size='m' />
        <Text>Hover me to see more information</Text>
      </Flex>
    ),
    content: (
      <Flex p='l' column gap='m' css={{ maxWidth: '300px' }}>
        <Text variant='heading' size='s'>
          Sample Hover Card
        </Text>
        <Text>
          This is an example of content that would appear in the hover card. It
          can include any components you want to render.
        </Text>
      </Flex>
    )
  }
}

export const WithCustomHeader: Story = {
  args: {
    children: <Text>Hover me</Text>,
    content: (
      <>
        <Flex
          w='100%'
          alignSelf='stretch'
          backgroundColor='surface1'
          borderBottom='default'
          p='xs'
          pl='xs'
          pr='s'
          alignItems='center'
          justifyContent='space-between'
        >
          <Text
            variant='label'
            size='s'
            color='subdued'
            textTransform='uppercase'
          >
            Custom Header
          </Text>
        </Flex>
        <Flex p='l' column gap='m'>
          <Text>This hover card has a custom header.</Text>
        </Flex>
      </>
    )
  }
}
