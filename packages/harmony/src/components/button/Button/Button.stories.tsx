import { expect } from '@storybook/jest'
import type { Meta, StoryObj } from '@storybook/react'
import { within } from '@storybook/testing-library'

import { Flex } from '~harmony/components/layout'
import { Text } from '~harmony/components/text'
import { IconArrowLeft, IconArrowRight } from '~harmony/icons'

import { Button } from './Button'
import { ButtonProps } from './types'

const meta: Meta<typeof Button> = {
  title: 'Buttons/Button',
  component: Button
}

export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {
  render: (props: ButtonProps) => <Button {...props}>Button</Button>
}

export const Variants: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button variant='primary'>Primary</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='tertiary'>Tertiary</Button>
      <Button variant='destructive'>Destructive</Button>
    </Flex>
  )
}

export const Sizes: Story = {
  render: () => (
    <Flex gap='3xl' alignItems='end'>
      <Flex direction='column' alignItems='center' gap='m'>
        <Button size='small'>Small</Button>
        <Text>32px</Text>
      </Flex>
      <Flex direction='column' alignItems='center' gap='m'>
        <Button size='default'>Medium</Button>
        <Text>48px</Text>
      </Flex>
      <Flex direction='column' alignItems='center' gap='m'>
        <Button size='large'>Large</Button>
        <Text>64px</Text>
      </Flex>
    </Flex>
  )
}

export const States: Story = {
  render: () => (
    <Flex
      direction='column'
      gap='2xl'
      justifyContent='center'
      alignItems='flex-start'
    >
      <Flex gap='2xl' alignItems='center'>
        <Text css={{ width: 56 }}>Hover</Text>
        <Button variant='primary' _isHovered>
          Primary
        </Button>
        <Button variant='secondary' _isHovered>
          Secondary
        </Button>
        <Button variant='tertiary' _isHovered>
          Tertiary
        </Button>
        <Button variant='destructive' _isHovered>
          Destructive
        </Button>
      </Flex>
      <Flex gap='2xl' alignItems='center'>
        <Text css={{ width: 56 }}>Pressed</Text>
        <Button variant='primary' _isPressed>
          Primary
        </Button>
        <Button variant='secondary' _isPressed>
          Secondary
        </Button>
        <Button variant='tertiary' _isPressed>
          Tertiary
        </Button>
        <Button variant='destructive' _isPressed>
          Destructive
        </Button>
      </Flex>
    </Flex>
  )
}

export const Disabled: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button variant='primary' disabled>
        Primary
      </Button>
      <Button variant='secondary' disabled>
        Secondary
      </Button>
      <Button variant='tertiary' disabled>
        Tertiary
      </Button>
      <Button variant='destructive' disabled>
        Destructive
      </Button>
    </Flex>
  )
}

export const Icons: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button iconLeft={IconArrowLeft}>Leading Icon</Button>
      <Button iconRight={IconArrowRight}>Trailing Icon</Button>
    </Flex>
  )
}

export const LoadingState: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button isLoading>Purchasing</Button>
      <Button variant='secondary' isLoading>
        Uploading
      </Button>
      <Button variant='tertiary' isLoading>
        Updating
      </Button>
      <Button variant='destructive' isLoading>
        Removing
      </Button>
    </Flex>
  )
}

export const ColorPropApplied: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button color='blue'>Default</Button>
      <Button color='blue' _isHovered>
        Hover
      </Button>
      <Button color='blue' _isPressed>
        Pressed
      </Button>
      <Button color='blue' disabled>
        Disabled
      </Button>
    </Flex>
  )
}

export const Link: Story = {
  args: { asChild: true },
  render: (props: ButtonProps) => {
    return (
      <Button {...props} asChild>
        <a
          href='/'
          onClick={(e) => {
            e.preventDefault()
          }}
          style={{ textDecorationLine: 'unset' }}
        >
          Click Me
        </a>
      </Button>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('link', { name: /click me/i })
    ).toBeInTheDocument()
  }
}
