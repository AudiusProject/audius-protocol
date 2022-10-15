import { makeStyles, flexRowCentered, font } from 'app/styles'

export const useStyles = makeStyles(({ palette }) => ({
  statItem: {
    ...flexRowCentered(),
    marginHorizontal: 10
  },
  statText: {
    ...font('medium'),
    fontSize: 12,
    letterSpacing: 0.2,
    color: palette.neutralLight4
  },
  image: {
    borderRadius: 4,
    height: 72,
    width: 72,
    backgroundColor: palette.neutralLight7
  },
  imageContainer: {
    marginTop: 10,
    marginRight: 12,
    marginLeft: 10
  },
  titles: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    textAlign: 'left',

    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '65%',
    marginRight: 12,
    marginTop: 10
  },
  title: {
    ...flexRowCentered(),
    width: '100%',
    minHeight: 20,
    marginTop: 'auto',
    marginBottom: 2,
    paddingRight: 20
  },
  artist: {
    ...flexRowCentered(),
    marginBottom: 'auto',
    paddingRight: 40,
    minHeight: 20
  }
}))
