import { expect } from '@storybook/jest'
import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent } from '@storybook/testing-library'

import { Flex } from '~harmony/components/layout'
import { IconSearch, IconVisibilityHidden, IconFilter } from '~harmony/icons'

import { TextInput } from './TextInput'
import { TextInputSize } from './types'

const meta: Meta<typeof TextInput> = {
  title: 'Inputs/TextInput',
  component: TextInput,
  parameters: {
    docs: {
      controls: {
        exclude: ['inputRef', 'inputRootClassName', 'inputClassName']
      }
    }
  }
}

export default meta

type Story = StoryObj<typeof TextInput>

export const Default: Story = {
  args: {
    label: 'Input label',
    helperText: 'This is assistive text.',
    placeholder: 'Placeholder'
  },
  render: (props) => <TextInput {...props} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    const textInput = canvas.getByRole('textbox', { name: /input label/i })

    await step('Enter text', async () => {
      await userEvent.type(textInput, 'test')

      await expect(textInput).toHaveValue('test')
    })
  }
}

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
      <Flex flex='1 1' direction='column' gap='2xl'>
        <TextInput label='Default' />
        <TextInput label='Hover' _isHovered _disablePointerEvents />
        <TextInput label='Focus' _isFocused _disablePointerEvents />
        <TextInput label='Error' error _disablePointerEvents />
        <TextInput label='Disabled' disabled />
      </Flex>
      <Flex flex='1 1' direction='column' gap='2xl'>
        <TextInput label='Default' value='Input value' />
        <TextInput
          label='Hover'
          value='Input value'
          _isHovered
          _disablePointerEvents
        />
        <TextInput
          label='Focus'
          value='Input value'
          _isFocused
          _disablePointerEvents
        />
        <TextInput
          label='Error'
          value='Input value'
          error
          _disablePointerEvents
        />
        <TextInput label='Disabled' value='Input value' disabled />
      </Flex>
    </Flex>
  )
}

export const SmallStates: Story = {
  render: () => (
    <Flex w='100%' gap='2xl'>
      <Flex flex='1 1' direction='column' gap='2xl'>
        <TextInput
          size={TextInputSize.SMALL}
          label='Default'
          placeholder='Default'
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Hover'
          placeholder='Hover'
          _isHovered
          _disablePointerEvents
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
      <Flex flex='1 1' direction='column' gap='2xl'>
        <TextInput
          size={TextInputSize.SMALL}
          label='Default'
          placeholder='Default'
          value='Input value'
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Hover'
          placeholder='Default'
          value='Input value'
          _isHovered
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Focus'
          placeholder='Focus'
          value='Input value'
          _isFocused
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Error'
          placeholder='Error'
          value='Input value'
          error
          _disablePointerEvents
        />
        <TextInput
          size={TextInputSize.SMALL}
          label='Disabled'
          placeholder='Disabled'
          value='Input value'
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
