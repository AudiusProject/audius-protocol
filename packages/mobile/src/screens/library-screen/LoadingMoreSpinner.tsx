import LoadingSpinner from 'app/components/loading-spinner/LoadingSpinner'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  spinner: {
    alignSelf: 'center',
    marginTop: spacing(1),
    marginBottom: spacing(8)
  }
}))

export const LoadingMoreSpinner = () => {
  const styles = useStyles()
  return <LoadingSpinner style={styles.spinner} />
}
