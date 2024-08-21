import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'
import { Text } from 'components/text'

import { Checkbox } from './Checkbox'
import { CheckboxProps } from './types'

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs/Checkbox',
  component: Checkbox
}

export default meta

type Story = StoryObj<typeof Checkbox>

type CheckboxLabelProps = CheckboxProps & {
  label: string
}

const CheckboxLabel = (props: CheckboxLabelProps) => {
  const { label, ...other } = props
  return (
    <Flex gap='2xl'>
      <Text css={{ width: 90 }}>{label}</Text>
      <Checkbox {...other} />
    </Flex>
  )
}

// Overview Story
export const Variants: Story = {
  render: () => (
    <Flex
      direction='column'
      pv='2xl'
      gap='2xl'
      justifyContent='space-around'
      borderRadius='s'
    >
      <CheckboxLabel label='Unchecked' />
      <CheckboxLabel label='Checked' checked />
      <CheckboxLabel label='Indeterminate' checked indeterminate />
    </Flex>
  )
}
