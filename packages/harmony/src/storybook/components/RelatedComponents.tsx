import { Flex, PlainButton, SocialButton } from 'components'

import InformationBox from './InformationBox'

const relatedComponentsMap = {
  PlainButton: {
    component: <PlainButton>Plain Button</PlainButton>,
    link: 'buttons-plainbutton--documentation'
  },
  SocialButton: {
    component: <SocialButton socialType='instagram' aria-label='instagram' />,
    link: 'buttons-socialbutton--documentation'
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
        const { component, link } = relatedComponentsMap[componentName]
        const fullLink = `../?path=/docs/components-${link}`
        return (
          <>
            <InformationBox
              key={componentName}
              component={component}
              href={fullLink}
              title={componentName}
              description='Lorem ipsum'
            />
            {/* <CardLink
              key={componentName}
              icon={icon}
              link={fullLink}
              subtitle={componentName}
              description='Lorem ipsum'
            /> */}
          </>
        )
      })}
    </Flex>
  )
}
