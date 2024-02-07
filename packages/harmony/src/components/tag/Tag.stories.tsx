import { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'
import { Text } from 'components/text'

import { Tag } from './Tag'

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag
}

export default meta

type Story = StoryObj<typeof Tag>

export const TagInput: Story = {
  render: () => (
    <Flex backgroundColor='surface1' border='default' p='l' gap='s'>
      <Tag multiselect>Bedroom</Tag>
      <Tag multiselect>Pop</Tag>
      <Tag variant='composed' multiselect>
        New Tag
      </Tag>
    </Flex>
  )
}

export const TopTags: Story = {
  render: () => {
    return (
      <Flex direction='column' gap='s'>
        <Text variant='label' strength='strong' color='subdued'>
          Top Tags
        </Text>
        <Flex gap='s' w={260} css={{ flexFlow: 'wrap' }}>
          <Tag>Bedroom</Tag>
          <Tag>Pop</Tag>
          <Tag>Alternative</Tag>
          <Tag>Indie</Tag>
          <Tag>Chill</Tag>
          <Tag>Lofi</Tag>
        </Flex>
      </Flex>
    )
  }
}

export const Variants: Story = {
  render: () => {
    return (
      <Flex direction='column' gap='2xl'>
        <Flex alignItems='center' gap='l'>
          <Text>Default</Text>
          <Tag variant='default'>Default</Tag>
        </Flex>
        <Flex alignItems='center' gap='l'>
          <Text>Composed</Text>
          <Tag variant='composed'>Composed</Tag>
        </Flex>
      </Flex>
    )
  }
}
