import { accountSelectors, playbackPositionSelectors } from '@audius/common/store';
import { formatLineupTileDuration } from '@audius/common/utils';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { IconCheck } from '@audius/harmony-native';
import Text from 'app/components/text';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
import { ProgressBar } from '../progress-bar';
var getUserId = accountSelectors.getUserId;
var getTrackPosition = playbackPositionSelectors.getTrackPosition;
var messages = {
    played: 'Played',
    unplayed: 'Unplayed',
    inProgress: 'In Progress',
    timeLeft: 'left'
};
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        progressInfoSection: {
            gap: spacing(2),
            paddingHorizontal: spacing(4),
            width: '100%'
        },
        progressInfoContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between'
        },
        progressTextContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            alignContent: 'center',
            gap: 2
        },
        progressInfoText: {
            fontSize: typography.body1.fontSize,
            color: palette.neutralLight4
        },
        progressTextIcon: {
            marginBottom: spacing(1)
        },
        progressTextProgressBar: {
            height: 4,
            marginVertical: 0
        }
    });
});
export var DetailsProgressInfo = function (_a) {
    var track = _a.track;
    var duration = track.duration;
    var neutralLight4 = useThemeColors().neutralLight4;
    var styles = useStyles();
    var currentUserId = useSelector(getUserId);
    var playbackPositionInfo = useSelector(function (state) {
        return getTrackPosition(state, { trackId: track.track_id, userId: currentUserId });
    });
    var progressText = playbackPositionInfo
        ? playbackPositionInfo.status === 'IN_PROGRESS'
            ? messages.inProgress
            : messages.played
        : messages.unplayed;
    var durationText = (playbackPositionInfo === null || playbackPositionInfo === void 0 ? void 0 : playbackPositionInfo.status) === 'IN_PROGRESS'
        ? "".concat(formatLineupTileDuration(duration - playbackPositionInfo.playbackPosition, true), " ").concat(messages.timeLeft)
        : formatLineupTileDuration(duration, true);
    return (<View style={styles.progressInfoSection}>
      <View style={styles.progressInfoContainer}>
        <Text style={styles.progressInfoText} weight='demiBold'>
          {durationText}
        </Text>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressInfoText} weight='demiBold'>
            {progressText}
          </Text>
          {(playbackPositionInfo === null || playbackPositionInfo === void 0 ? void 0 : playbackPositionInfo.status) === 'COMPLETED' ? (<IconCheck style={styles.progressTextIcon} height={16} width={16} fill={neutralLight4}/>) : null}
        </View>
      </View>
      {(playbackPositionInfo === null || playbackPositionInfo === void 0 ? void 0 : playbackPositionInfo.status) === 'IN_PROGRESS' ? (<ProgressBar progress={duration
                ? (playbackPositionInfo.playbackPosition / duration) * 100
                : 0} max={100} style={{ root: styles.progressTextProgressBar }}/>) : null}
    </View>);
};
