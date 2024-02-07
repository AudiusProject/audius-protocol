import { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'
import { RadioGroup } from 'components/radio-group'
import { Text } from 'components/text'

import { Radio } from './Radio'

const meta: Meta<typeof Radio> = {
  component: Radio,
  title: 'Components/Radio [beta]'
}

export default meta

type Story = StoryObj<typeof Radio>

export const Primary: Story = {
  render: (props) => (
    <RadioGroup name='test-radio-buttons' gap='l' direction='column'>
      <Flex as='label' direction='column' gap='s'>
        <Flex alignItems='center' gap='m'>
          <Radio value={1} {...props} />
          <Text variant='heading' color='default'>
            Option 1 Title
          </Text>
        </Flex>
        <Text variant='body' color='default'>
          Option description
        </Text>
      </Flex>
      <Flex as='label' direction='column' gap='s'>
        <Flex alignItems='center' gap='m'>
          <Radio value={2} {...props} />
          <Text variant='heading' color='default'>
            Option 2 Title
          </Text>
        </Flex>
        <Text variant='body' color='default'>
          Option description
        </Text>
      </Flex>
      <Flex as='label' direction='column' gap='s'>
        <Flex alignItems='center' gap='m'>
          <Radio disabled value={3} {...props} />
          <Text variant='heading' color='default'>
            Option 3 Title
          </Text>
        </Flex>
        <Text variant='body' color='default'>
          Disabled Option description
        </Text>
      </Flex>
    </RadioGroup>
  )
}
