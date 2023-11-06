import { Text, Box, Divider, Flex, PlainButton, SocialButton } from 'components'

import { InformationBox } from './InformationBox'

const relatedComponentsMap = {
  PlainButton: {
    component: <PlainButton>Plain Button</PlainButton>,
    link: 'buttons-plainbutton--documentation',
    description: 'A Button with no border and background.'
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
        style={{ background: 'white' }}
      >
        <Text variant='label'>A</Text>
        <Divider />
        <Text variant='label'>B</Text>
      </Flex>
    ),
    description:
      'A separator between two elements, usually consisting of a horizontal  or vertical line.',
    link: 'components-layout-divider--documentation'
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
      'Description of component goes here and will likely go to 2-3 lines so that its can fully explain itself.',
    link: 'components-layout-box--documentation'
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
      'Description of component goes here and will likely go to 2-3 lines so that its can fully explain itself.',
    link: 'components-layout-flex--documentation'
  }
}

type RelatedComponentsProps = {
  componentNames: Array<keyof typeof relatedComponentsMap>
}

export const RelatedComponents = (props: RelatedComponentsProps) => {
  const { componentNames } = props

  return (
    <Flex gap='2xl' mt='3xl'>
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
