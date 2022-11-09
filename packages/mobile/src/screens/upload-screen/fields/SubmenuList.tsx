import { Children, cloneElement } from 'react'
import type { ReactNode, ReactElement } from 'react'

import { View } from 'react-native'

import { makeStyles } from 'app/styles'

type SubmenuListProps = {
  children: ReactNode
  removeBottomDivider?: boolean
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(2)
  }
}))

export const SubmenuList = (props: SubmenuListProps) => {
  const styles = useStyles()
  const { children, removeBottomDivider } = props
  const updatedChildren = Children.map(children, (child: ReactElement, index) =>
    cloneElement(child, {
      lastItem: !removeBottomDivider && index === Children.count(children) - 1
    })
  )
  return <View style={styles.root}>{updatedChildren}</View>
}
