import { Box, Flex, Text, Paper, Button } from 'components'
import { IconNote } from 'icons'

import { InformationBox } from './InformationBox'

const relatedFoundationsMap = {
  Typography: {
    title: 'Typography',
    description: 'Typography expresses hierarchy and brand presence.',
    component: <Text variant='display'>Ag</Text>,
    to: {
      kind: 'foundations-typography',
      story: 'documentation'
    }
  },
  Color: {
    title: 'Color',
    description:
      'The consistent use of color makes for a unified and engaging user experience.',
    component: (
      <Flex>
        <Box
          h={48}
          w={48}
          css={(theme) => ({ background: theme.color.primary.p100 })}
        />
        <Box
          h={48}
          w={48}
          css={(theme) => ({ background: theme.color.primary.p200 })}
        />
        <Box
          h={48}
          w={48}
          css={(theme) => ({ background: theme.color.primary.p300 })}
        />
      </Flex>
    ),
    to: { kind: 'foundations-color', story: 'documentation' }
  },
  Shadow: {
    title: 'Shadow',
    description:
      'Shadows offer elevation by distinguishing surface distances along the z-axis.',
    component: (
      <Flex gap='l'>
        <Paper h={48} w={48} borderRadius='s' shadow='near' />
        <Paper h={48} w={48} borderRadius='s' shadow='mid' />
        <Paper h={48} w={48} borderRadius='s' shadow='far' />
      </Flex>
    ),
    to: { kind: 'foundations-shadow', story: 'documentation' }
  },
  CornerRadius: {
    title: 'Corner Radius',
    description:
      'Used to give sharp edges a more subtle, rounded effect and style.',
    to: { kind: 'foundations-corner-radius', story: 'documentation' },
    component: (
      <Flex gap='l'>
        <Box
          h={48}
          w={48}
          css={(theme) => ({
            border: '1px solid rgba(0, 0, 0, 0.20)',
            background: theme.color.background.white,
            borderRadius: theme.cornerRadius.xs
          })}
        />
        <Box
          h={48}
          w={48}
          css={(theme) => ({
            border: '1px solid rgba(0, 0, 0, 0.20)',
            background: theme.color.background.white,
            borderRadius: theme.cornerRadius.m
          })}
        />
        <Box
          h={48}
          w={48}
          css={(theme) => ({
            border: '1px solid rgba(0, 0, 0, 0.20)',
            background: theme.color.background.white,
            borderRadius: theme.cornerRadius.xl
          })}
        />
      </Flex>
    )
  },
  Spacing: {
    title: 'Spacing',
    description:
      'Ensure layouts are consistent with our intuitive spacing system.',
    to: { kind: 'foundations-spacing', story: 'documentation' },
    component: (
      <Flex
        h={48}
        w={107}
        alignItems='center'
        justifyContent='center'
        css={{ background: 'rgba(255, 0, 0, 0.10)' }}
      >
        <Text variant='body' size='xs' css={{ color: '#F00' }}>
          32
        </Text>
      </Flex>
    )
  },
  Icons: {
    title: 'Icons',
    description:
      'Visually communicate intent. Icons that are crisp, clear, and coherent.',
    to: { kind: 'icons-utility-icons', story: 'documentation' },
    component: <IconNote height={48} width={48} color='default' />
  },
  Motion: {
    title: 'Motion',
    description:
      'Animations that brings the UI to life and ensuring usability.',
    to: { kind: 'foundations-motion', story: 'documentation' },
    component: <Button color='blue'>Quick!</Button>
  }
}

type RelatedFoundationsProps = {
  foundationNames: Array<keyof typeof relatedFoundationsMap>
}

export const RelatedFoundations = (props: RelatedFoundationsProps) => {
  const { foundationNames } = props

  return (
    <Flex
      mv='3xl'
      gap='2xl'
      // Style children to have max of 3 per row but fill the last row
      css={{ section: { flex: '1 1', minWidth: 300 } }}
      wrap='wrap'
      justifyContent='space-between'
    >
      {foundationNames.map((foundationName) => {
        const { component, title, to, description } =
          relatedFoundationsMap[foundationName]

        return (
          <InformationBox
            key={foundationName}
            component={component}
            to={to}
            title={title}
            description={description}
          />
        )
      })}
    </Flex>
  )
}
