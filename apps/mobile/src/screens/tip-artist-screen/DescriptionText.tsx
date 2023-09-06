import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  text: {
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing(6)
  }
}))

type DescriptionTextProps = TextProps

export const DescriptionText = (props: DescriptionTextProps) => {
  const styles = useStyles()
  return (
    <Text fontSize='medium' weight='demiBold' style={styles.text} {...props} />
  )
}
