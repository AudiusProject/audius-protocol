import { Flex, PlainButton, SocialButton } from 'components'

import InformationBox from './InformationBox'

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
