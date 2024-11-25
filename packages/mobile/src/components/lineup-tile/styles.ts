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
    marginTop: spacing(2),
    marginRight: spacing(2),
    marginLeft: spacing(2)
  },
  titles: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexBasis: '65%',
    marginRight: spacing(3),
    marginTop: spacing(2),
    gap: 2
  },
  title: {
    ...flexRowCentered(),
    width: '100%'
  },
  titlePlaying: {
    paddingRight: spacing(5)
  },
  artist: {
    ...flexRowCentered(),
    marginBottom: 'auto',
    paddingRight: spacing(10),
    minHeight: 20
  }
}))
