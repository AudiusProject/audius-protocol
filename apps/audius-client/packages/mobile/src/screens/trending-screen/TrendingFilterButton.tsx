import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  headerButton: {
    height: 24,
    paddingHorizontal: spacing(1),
    minWidth: 88,
    borderRadius: 6,
    backgroundColor: palette.secondary
  },
  headerButtonText: {
    fontSize: 14,
    textTransform: 'none'
  }
}))
export const TrendingFilterButton = () => {
  const styles = useStyles()
  return (
    <Button
      variant='primary'
      title='All Genres'
      size='small'
      onPress={() => {}}
      styles={{ root: styles.headerButton, text: styles.headerButtonText }}
    />
  )
}
