import { makeStyles, flexRowCentered, font } from 'app/styles'
import { spacing } from 'app/styles/spacing'

export const useStyles = makeStyles(({ palette }) => ({
  statItem: {
    ...flexRowCentered()
  },
  statTextContainer: {
    flexDirection: 'row',
    gap: spacing(3),
    alignItems: 'center'
  },
  statTextProgressBar: {
    height: 4,
    width: 72,
    marginVertical: 0,
    paddingVertical: 0
  },
  statText: {
    ...font('medium'),
    fontSize: 12,
    letterSpacing: 0.2,
    color: palette.neutralLight4
  },
  completeStatText: {
    color: palette.secondary
  },
  image: {
    borderRadius: 4,
    height: 72,
    width: 72
  },
  imageContainer: {
    marginTop: spacing(2.5),
    marginRight: spacing(3),
    marginLeft: spacing(2.5)
  },
  titles: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    textAlign: 'left',

    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '65%',
    marginRight: spacing(3),
    marginTop: spacing(2.5)
  },
  title: {
    ...flexRowCentered(),
    width: '100%',
    minHeight: 20,
    marginTop: 'auto',
    marginBottom: 2,
    paddingRight: spacing(5)
  },
  artist: {
    ...flexRowCentered(),
    marginBottom: 'auto',
    paddingRight: spacing(10),
    minHeight: 20
  }
}))
