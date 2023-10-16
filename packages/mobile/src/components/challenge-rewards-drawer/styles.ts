import { flexRowCentered, makeStyles } from 'app/styles'

export const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  content: {
    padding: spacing(4),
    paddingTop: 0,
    gap: spacing(6),
    alignItems: 'center'
  },
  scrollViewContainer: {
    flex: 1
  },
  scrollViewContent: {
    padding: spacing(4),
    paddingTop: 0,
    gap: spacing(6)
  },
  subheader: {
    textAlign: 'center',
    marginBottom: spacing(3)
  },
  progressSubheader: {
    textAlign: 'left'
  },
  subheaderIcon: {
    marginBottom: spacing(3),
    marginRight: 10
  },
  task: {
    width: '100%'
  },
  taskHeader: {
    ...flexRowCentered()
  },
  audioMatchingDescriptionContainer: {
    gap: spacing(3)
  },
  statusGrid: {
    borderRadius: spacing(4),
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    width: '100%',
    marginBottom: spacing(6),
    flexDirection: 'column',
    overflow: 'hidden'
  },
  statusGridColumns: {
    padding: spacing(4),
    gap: spacing(4),
    flexDirection: 'row',
    justifyContent: 'center'
  },
  rewardCell: {
    justifyContent: 'center'
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
    fontSize: spacing(3)
  },
  stickyClaimRewardsContainer: {
    borderTopWidth: 1,
    borderTopColor: palette.borderDefault,
    paddingBottom: spacing(10),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(4),
    width: '100%'
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
    color: palette.staticAccentGreenLight1
  },
  claimedAmountContainer: {
    ...flexRowCentered(),
    borderTopColor: palette.borderStrong,
    backgroundColor: palette.backgroundSurface2,
    justifyContent: 'center',
    borderTopWidth: 1,
    padding: spacing(4)
  },
  claimedAmount: {
    marginTop: spacing(4),
    textAlign: 'center',
    color: palette.neutralLight4
  }
}))
