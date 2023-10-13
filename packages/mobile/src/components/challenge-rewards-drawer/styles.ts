import { flexRowCentered, makeStyles } from 'app/styles'

export const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  content: {
    padding: spacing(4),
    alignItems: 'center'
  },
  subheader: {
    textAlign: 'left',
    color: palette.neutralLight4,
    fontSize: spacing(4),
    textTransform: 'uppercase',
    marginBottom: spacing(3)
  },
  subheaderIcon: {
    marginBottom: spacing(3),
    marginRight: 10
  },
  task: {
    width: '100%',
    padding: spacing(6),
    paddingTop: 0
  },
  taskHeader: {
    ...flexRowCentered()
  },
  taskText: {
    fontSize: spacing(4)
  },
  statusGrid: {
    borderRadius: spacing(4),
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    width: '100%',
    marginBottom: spacing(6),
    flexDirection: 'column'
  },
  statusGridColumns: {
    padding: spacing(4),
    flexDirection: 'row',
    justifyContent: 'center'
  },
  rewardCell: {
    paddingRight: spacing(4)
  },
  progressCell: {
    flex: 1,
    paddingLeft: spacing(4),
    borderLeftWidth: 1,
    borderColor: palette.neutralLight8
  },
  statusCell: {
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: spacing(3),
    backgroundColor: palette.neutralLight9,
    borderBottomLeftRadius: spacing(4),
    borderBottomRightRadius: spacing(4)
  },
  statusCellComplete: {
    backgroundColor: palette.staticAccentGreenLight1
  },
  statusTextInProgress: {
    color: palette.secondaryLight1
  },
  statusTextComplete: {
    color: palette.staticWhite
  },
  audioAmount: {
    textAlign: 'center',
    fontSize: typography.fontSize.xxxxxl
  },
  audioLabel: {
    textAlign: 'center',
    fontSize: spacing(3),
    color: palette.neutralLight4
  },
  claimRewardsContainer: {
    marginTop: spacing(4),
    width: '100%'
  },
  claimRewardsError: {
    textAlign: 'center',
    color: palette.accentRed,
    fontSize: spacing(4),
    marginTop: spacing(6)
  },
  claimButtonContainer: {
    width: '100%'
  },
  claimButton: {
    paddingVertical: spacing(3)
  },
  claimableAmount: {
    marginVertical: spacing(4),
    textAlign: 'center',
    textTransform: 'uppercase',
    color: palette.staticAccentGreenLight1
  },
  claimedAmount: {
    marginTop: spacing(4),
    textAlign: 'center',
    textTransform: 'uppercase',
    color: palette.neutralLight4
  }
}))
