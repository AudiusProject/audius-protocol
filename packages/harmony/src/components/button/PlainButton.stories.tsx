import type { Story } from '@storybook/react'

import * as Icons from '../typography/Icons'

import { PlainButton } from './PlainButton'
import { PlainButtonProps, PlainButtonSize, PlainButtonType } from './types'

export default {
  component: PlainButton,
  title: 'Components/PlainButton',
  argTypes: { onClick: { action: 'clicked' } }
}

const baseProps: PlainButtonProps = {
  iconLeft: Icons.IconCampfire,
  iconRight: Icons.IconCampfire,
  text: 'Click Me'
}

type StoryArgs = {
  props: Partial<PlainButtonProps>
  dark?: boolean
}

const Template: Story<StoryArgs> = ({ dark = false, props }) => (
  <div
    style={{
      background: dark ? '#878787' : undefined,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}
  >
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <PlainButton {...baseProps} size={PlainButtonSize.DEFAULT} {...props} />
      <PlainButton {...baseProps} size={PlainButtonSize.LARGE} {...props} />
    </div>
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <PlainButton
        {...baseProps}
        size={PlainButtonSize.DEFAULT}
        {...props}
        disabled
      />
      <PlainButton
        {...baseProps}
        size={PlainButtonSize.LARGE}
        {...props}
        disabled
      />
    </div>
  </div>
)

// Default
export const Default = Template.bind({})

// Subdued
export const Subdued = Template.bind({})
Subdued.args = { props: { variant: PlainButtonType.SUBDUED } }

// Inverted
export const Inverted = Template.bind({})
Inverted.args = {
  dark: true,
  props: { variant: PlainButtonType.INVERTED }
}
