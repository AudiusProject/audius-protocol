import { PropsWithChildren } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from '~harmony/components/layout'
import { Text } from '~harmony/components/text'

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

const Label = ({ children }: PropsWithChildren) => {
  return <Text css={{ width: 90 }}>{children}</Text>
}

const CheckboxLabel = (props: CheckboxLabelProps) => {
  const { label, ...other } = props
  return (
    <Flex gap='2xl'>
      <Label>{label}</Label>
      <Checkbox {...other} />
    </Flex>
  )
}

// Overview Story
export const Variants: Story = {
  render: () => (
    <Flex direction='column' p='2xl' gap='2xl'>
      <CheckboxLabel label='Unchecked' />
      <CheckboxLabel label='Checked' checked />
      <CheckboxLabel label='Indeterminate' checked indeterminate />
    </Flex>
  )
}

export const States: Story = {
  render: () => (
    <Flex direction='column' p='2xl' gap='2xl'>
      <Flex gap='2xl'>
        <Label>Default</Label>
        <Checkbox />
        <Checkbox checked />
      </Flex>
      <Flex gap='2xl'>
        <Label>Hover</Label>
        <Checkbox _isHovered />
        <Checkbox _isHovered checked />
      </Flex>
      <Flex gap='2xl'>
        <Label>Focused</Label>
        <Checkbox _isFocused />
        <Checkbox _isFocused checked />
      </Flex>
    </Flex>
  )
}

export const Indeterminate: Story = {
  render: () => (
    <Flex direction='column' p='2xl' gap='2xl'>
      <CheckboxLabel label='Default' checked indeterminate />
      <CheckboxLabel label='Hover' checked indeterminate _isHovered />
      <CheckboxLabel label='Focused' checked indeterminate _isFocused />
    </Flex>
  )
}
