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
    link: 'buttons-button--documentation'
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
    link: 'input-textinput--documentation'
  },
  SelectablePill: {
    title: 'Selectable Pill',
    description: 'Used for binary selections',
    component: (
      <SelectablePill label='SelectablePill' size='large' isSelected={false} />
    ),
    link: 'input-selectablepill--documentation'
  },
  PlainButton: {
    title: 'Plain Button',
    description:
      'The plain button is like our button component but without a bounding frame or container.',
    component: <PlainButton iconRight={IconCaretRight}>See More</PlainButton>,
    link: 'buttons-plainbutton--documentation'
  },
  TextLink: {
    title: 'Text Link',
    description:
      'Apply link text properties to any text to link an internal or external page.',
    component: null,
    link: 'textlink--documentation'
  },
  SocialButton: {
    component: <SocialButton socialType='instagram' aria-label='instagram' />,
    link: 'buttons-socialbutton--documentation',
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
        <Divider />
        <Text variant='label'>B</Text>
      </Flex>
    ),
    description:
      'A separator between two elements, usually consisting of a horizontal  or vertical line.',
    link: 'layout-divider--documentation'
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
    link: 'avatar--documentation'
  },
  Paper: {
    title: 'Paper',
    description:
      'Ensure layouts are consistent with our intuitive spacing system.',
    component: <Paper w={124} h={70} shadow='mid' />,
    link: 'layout-paper--documentation'
  },
  Box: {
    component: (
      <Box
        border='default'
        p='xs'
        w={148}
        h={60}
        style={{ background: 'white' }}
      >
        <Text>Hello World</Text>
      </Box>
    ),
    description:
      'A simple layout component which adds pre-defined margin, padidng, and borders',
    link: 'layout-box--documentation'
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
    link: 'components-layout-flex--documentation'
  },
  FollowButton: {
    title: 'Follow Button',
    description: 'The Follow button allow users to hold an on or off state.',
    component: 'TODO',
    link: 'TODO'
  },
  RadioInput: {
    title: 'Radio Input',
    description:
      'Radio buttons allow a user to select a single option from a list of predefined options.',
    component: 'TODO',
    link: 'TODO'
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
        const { component, link, description } =
          relatedComponentsMap[componentName]
        const fullLink = `../?path=/docs/components-${link}`
        return (
          <InformationBox
            key={componentName}
            component={component}
            href={fullLink}
            title={componentName}
            description={description}
          />
        )
      })}
    </Flex>
  )
}
