import { Children, cloneElement } from 'react'
import type { ReactNode, ReactElement } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

type SubmenuListProps = {
  children: ReactNode
  removeBottomDivider?: boolean
  style?: StyleProp<ViewStyle>
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(2)
  },
  content: {
    marginHorizontal: spacing(2)
  },
  divider: {
    marginHorizontal: spacing(-4)
  }
}))

export const SubmenuList = (props: SubmenuListProps) => {
  const { root, ...styles } = useStyles()
  const { children, removeBottomDivider, style } = props
  const updatedChildren = Children.map(children, (child: ReactElement, index) =>
    cloneElement(child, {
      styles,
      lastItem: !removeBottomDivider && index === Children.count(children) - 1
    })
  )
  return <View style={[root, style]}>{updatedChildren}</View>
}
