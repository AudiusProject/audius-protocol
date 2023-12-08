import {
  Text,
  Box,
  Divider,
  Flex,
  PlainButton,
  SocialButton,
  Button,
  TextInput,
  SelectablePill,
  Paper,
  Avatar
} from 'components'
import { IconCaretRight } from 'icons'
import shadowBackground from 'storybook/assets/shadowBackground.jpeg'

import { InformationBox } from './InformationBox'

const relatedComponentsMap = {
  Button: {
    title: 'Button',
    description:
      'Buttons allow users to trigger an action or event with a single click.',
    component: <Button>Button</Button>,
    to: {
      kind: 'buttons-button',
      story: 'documentation'
    }
  },
  TextInput: {
    title: 'Text Input',
    description: 'An input is a field where users can enter and edit text.',
    component: (
      <TextInput
        label='Input label'
        placeholder='Placeholder value'
        _isFocused
      />
    ),
    to: { kind: 'inputs-textinput', story: 'documentation' }
  },
  SelectablePill: {
    title: 'Selectable Pill',
    description: 'Used for binary selections',
    component: (
      <SelectablePill label='SelectablePill' size='large' isSelected={false} />
    ),
    to: { kind: 'inputs-selectablepill', story: 'documentation' }
  },
  PlainButton: {
    title: 'Plain Button',
    description:
      'The plain button is like our button component but without a bounding frame or container.',
    component: <PlainButton iconRight={IconCaretRight}>See More</PlainButton>,
    to: { kind: 'buttons-plainbutton-beta', story: 'documentation' }
  },
  SocialButton: {
    component: <SocialButton socialType='instagram' aria-label='instagram' />,
    to: { kind: 'buttons-socialbutton', story: 'documentation' },
    description: 'A button that can connect a users socials.'
  },
  Divider: {
    component: (
      <Flex
        border='strong'
        borderRadius='m'
        p='l'
        gap='m'
        css={{ background: 'white' }}
      >
        <Text variant='label'>A</Text>
        <Divider orientation='vertical' />
        <Text variant='label'>B</Text>
        <Divider orientation='vertical' />
        <Text variant='label'>C</Text>
        <Divider orientation='vertical' />
        <Text variant='label'>D</Text>
      </Flex>
    ),
    description:
      'A separator between two elements, usually consisting of a horizontal  or vertical line.',
    to: { kind: 'layout-divider', story: 'documentation' }
  },
  Avatar: {
    title: 'Avatar',
    description:
      'Ensure layouts are consistent with our intuitive spacing system.',
    component: (
      <Box w={80} h={80}>
        <Avatar src={shadowBackground} />
      </Box>
    ),
    to: { kind: 'components-avatar', story: 'documentation' }
  },
  Paper: {
    title: 'Paper',
    description:
      'Ensure layouts are consistent with our intuitive spacing system.',
    component: <Paper w={200} h={80} shadow='mid' />,
    to: { kind: 'layout-paper', story: 'documentation' }
  },
  Box: {
    component: (
      <Box
        border='default'
        borderRadius='s'
        p='xs'
        w={148}
        h={60}
        style={{ background: 'white' }}
      />
    ),
    description:
      'A simple layout component which adds pre-defined margin, padding, and borders',
    to: { kind: 'layout-box', story: 'documentation' }
  },
  Flex: {
    component: (
      <Flex
        border='strong'
        borderRadius='m'
        p='l'
        gap='m'
        style={{ background: 'white' }}
      >
        <Text variant='label'>A</Text>
        <Text variant='label'>B</Text>
        <Text variant='label'>C</Text>
        <Text variant='label'>D</Text>
      </Flex>
    ),
    description:
      'A layout component to handle flex behavior without manual styling.',
    to: { kind: 'layout-flex', story: 'documentation' }
  },
  FollowButton: {
    title: 'Follow Button',
    description: 'The Follow button allow users to hold an on or off state.',
    component: 'TODO',
    to: undefined
  },
  RadioInput: {
    title: 'Radio Input',
    description:
      'Radio buttons allow a user to select a single option from a list of predefined options.',
    component: 'TODO',
    to: undefined
  }
}

type RelatedComponentsProps = {
  componentNames: Array<keyof typeof relatedComponentsMap>
}

export const RelatedComponents = (props: RelatedComponentsProps) => {
  const { componentNames } = props

  return (
    <Flex
      mv='3xl'
      gap='2xl'
      // Style children to have max of 3 per row but fill the last row
      css={{ section: { flex: '1 1', minWidth: 300 } }}
      wrap='wrap'
      justifyContent='space-between'
    >
      {componentNames.map((componentName) => {
        const { component, to, description } =
          relatedComponentsMap[componentName]
        return (
          <InformationBox
            key={componentName}
            component={component}
            to={to}
            title={componentName}
            description={description}
          />
        )
      })}
    </Flex>
  )
}
