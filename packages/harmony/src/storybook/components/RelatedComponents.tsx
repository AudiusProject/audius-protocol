import IconNote from 'assets/icons/Note.svg'
import { Flex } from 'components'

import { Lockup } from './Lockup'

const relatedComponentsMap = {
  PlainButton: {
    icon: IconNote,
    link: 'buttons-plainbutton--documentation'
  },
  SocialButton: {
    icon: IconNote,
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
        const { icon, link } = relatedComponentsMap[componentName]
        const fullLink = `../?path=/docs/components-${link}`
        return (
          <Lockup
            key={componentName}
            icon={icon}
            link={fullLink}
            subtitle={componentName}
            description='Lorem ipsum'
          />
        )
      })}
    </Flex>
  )
}
