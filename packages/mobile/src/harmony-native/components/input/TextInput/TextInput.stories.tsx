import type { Meta, StoryObj } from '@storybook/react-native'

import {
  IconFilter,
  IconSearch,
  IconVisibilityHidden
} from '@audius/harmony-native'

import { Flex } from '../../layout'

import { TextInput } from './TextInput'
import { TextInputSize, type TextInputProps } from './types'

const meta: Meta<TextInputProps> = {
  title: 'Components/Input/TextInput',
  component: TextInput,
  argTypes: {
    label: {
      description: 'Label',
      control: { type: 'text' }
    },
    helperText: {
      description: 'Helper Text',
      control: { type: 'text' }
    },
    placeholder: {
      description: 'Placeholder',
      control: { type: 'text' }
    },
    size: {
      description: 'Size',
      control: { type: 'radio' },
      options: [TextInputSize.DEFAULT, TextInputSize.SMALL]
    }
  },
  args: {
    label: 'Input label',
    helperText: 'This is assistive text.',
    placeholder: 'Placeholder'
  },
  render: (props) => <TextInput {...props} />
}

export default meta

type Story = StoryObj<TextInputProps>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <Flex gap='2xl'>
      <TextInput label='Search' />
      <TextInput
        label='Search'
        placeholder='Search'
        size={TextInputSize.SMALL}
        startIcon={IconSearch}
      />
    </Flex>
  )
}

export const DefaultStates: Story = {
  render: () => (
    <Flex w='100%' gap='2xl'>
      <Flex direction='column' gap='2xl'>
        <TextInput label='Default' />
        <TextInput label='Focus' _isFocused _disablePointerEvents />
        <TextInput label='Error' error _disablePointerEvents />
        <TextInput label='Disabled' disabled />
      </Flex>
      <Flex direction='column' gap='2xl'>
        <TextInput label='Default' value='Input Value' />
        <TextInput
          label='Focus'
          value='Input Value'
          _isFocused
          _disablePointerEvents
        />
        <TextInput
          label='Error'
          value='Input Value'
          error
          _disablePointerEvents
        />
        <TextInput label='Disabled' value='Input Value' disabled />
      </Flex>
    </Flex>
  )
}

export const SmallStates: Story = {
  render: () => (
    <Flex w='100%' gap='2xl'>
      <Flex direction='column' gap='2xl'>
        <TextInput
          size={TextInputSize.SMALL}
          label='Default'
          placeholder='Default'
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Focus'
          placeholder='Focus'
          _isFocused
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Error'
          placeholder='Error'
          error
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Disabled'
          placeholder='Disabled'
          disabled
        />
      </Flex>
      <Flex direction='column' gap='2xl'>
        <TextInput
          size={TextInputSize.SMALL}
          label='Default'
          placeholder='Default'
          value='Input Value'
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Focus'
          placeholder='Focus'
          value='Input Value'
          _isFocused
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Error'
          placeholder='Error'
          value='Input Value'
          error
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Disabled'
          placeholder='Disabled'
          value='Input Value'
          disabled
        />
      </Flex>
    </Flex>
  )
}

export const Icons: Story = {
  render: () => (
    <Flex gap='2xl' direction='column'>
      <Flex gap='2xl'>
        <TextInput label='Leading icon' startIcon={IconSearch} />
        <TextInput label='Trailing icon' endIcon={IconVisibilityHidden} />
      </Flex>
      <Flex gap='2xl'>
        <TextInput
          label='Search'
          placeholder='Search'
          size={TextInputSize.SMALL}
          startIcon={IconSearch}
        />
        <TextInput
          label='Search'
          placeholder='Search'
          size={TextInputSize.SMALL}
          endIcon={IconFilter}
        />
      </Flex>
    </Flex>
  )
}

export const AssistiveText: Story = {
  render: () => (
    <Flex gap='2xl'>
      <TextInput label='Input label' helperText='This is assistive text.' />
      <TextInput
        label='Input label'
        placeholder='Input label'
        size={TextInputSize.SMALL}
        helperText='This is assistive text.'
      />
    </Flex>
  )
}

export const Validation: Story = {
  render: () => (
    <Flex gap='2xl' direction='column'>
      <TextInput
        label='Email'
        placeholder='Enter email'
        value='email@gmai.c'
        helperText='Please enter a valid email.'
        error
      />
      <TextInput
        label='Handle'
        placeholder='Enter handle'
        value='AdorableGoat'
        helperText='That handle has already been taken.'
        error
      />
      <TextInput
        label='Handle'
        startAdornmentText='@'
        maxLength={30}
        helperText='Handle can not exceed 30 characters.'
        value='Longhanglethatalmostreaches'
      />
    </Flex>
  )
}

export const SpecialInputs: Story = {
  render: () => (
    <Flex gap='2xl' direction='column'>
      <Flex gap='2xl'>
        <TextInput label='Handle' startAdornmentText='@' maxLength={30} />
        <TextInput
          label='Custom amount'
          placeholder='Enter a value'
          startAdornmentText='$'
        />
      </Flex>
      <Flex gap='2xl'>
        <TextInput
          label='Amount to send'
          placeholder='Enter an amount'
          endAdornmentText='$AUDIO'
        />
        <TextInput
          label='Amount to withdraw'
          placeholder='Enter an amount'
          startAdornmentText='$'
          endAdornmentText='USDC'
        />
      </Flex>
    </Flex>
  )
}
