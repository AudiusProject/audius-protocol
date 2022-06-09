import React from 'react'

import { Story } from '@storybook/react'

import * as Icons from 'components/Icons'

import { Button } from './Button'
import { ButtonProps } from './types'

export default {
  component: Button,
  title: 'Components/Button',
  argTypes: { onClick: { action: 'clicked' } }
}

const Template: Story<ButtonProps> = args => <Button {...args} />

// Primary
export const Primary = Template.bind({})
const primaryProps: ButtonProps = {
  leftIcon: <Icons.IconPlay />,
  text: 'Click Me'
}

Primary.args = primaryProps
