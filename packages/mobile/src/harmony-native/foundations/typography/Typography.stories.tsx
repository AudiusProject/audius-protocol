import type { StoryObj } from '@storybook/react-native'

import type { TextProps } from '../../components/Text/Text'
import { Text } from '../../components/Text/Text'

const TypographyMeta = {
  title: 'Foundation/Typography',
  component: Text,
  args: {
    children:
      'Audius, freedom to share and listen. Giving everyone the freedom to distribute, monetize, and stream unstoppable audio.'
  },
  argTypes: {
    variant: {
      description: 'Text Variant',
      control: { type: 'select' },
      options: ['display', 'heading', 'title', 'label', 'body']
    },
    strength: {
      description: 'Font Strength/Weight',
      control: { type: 'radio' },
      options: ['strong', 'default', 'weak']
    },
    size: {
      description: 'Font Size',
      control: { type: 'select' },
      options: ['xl', 'l', 'm', 's', 'xs']
    },
    color: {
      description: 'Text Color',
      control: { type: 'select' },
      options: ['heading', 'default', 'subdued', 'disabled']
    },
    children: {
      description: 'Text',
      control: { type: 'text' }
    }
  }
}

export default TypographyMeta

export const Default = {}

export const Body: StoryObj<TextProps> = {
  args: {
    variant: 'body'
  }
}

export const Disabled: StoryObj<TextProps> = {
  args: {
    variant: 'body',
    color: 'disabled'
  }
}

export const StrongDisplay: StoryObj<TextProps> = {
  args: {
    variant: 'display',
    color: 'heading',
    strength: 'strong',
    size: 's'
  }
}

export const LargeTitle: StoryObj<TextProps> = {
  args: {
    variant: 'title',
    size: 'l'
  }
}

export const SubduedLabel: StoryObj<TextProps> = {
  args: {
    variant: 'label',
    color: 'subdued'
  }
}
