import { Divider as DividerBase } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    height: spacing(6)
  }
}))

export const Divider = () => {
  const styles = useStyles()
  return <DividerBase style={styles.root} />
}
