import React from 'react';
import { formatCooldownChallenges, useChallengeCooldownSchedule } from '@audius/common/hooks';
import { SummaryTable } from '../summary-table';
var messages = {
    readyToClaim: 'Ready to Claim!',
    upcomingRewards: 'Upcoming Rewards',
    audio: '$AUDIO'
};
export var CooldownSummaryTable = function (_a) {
    var challengeId = _a.challengeId;
    var _b = useChallengeCooldownSchedule({ challengeId: challengeId }), cooldownChallenges = _b.cooldownChallenges, summary = _b.summary, isEmpty = _b.isEmpty;
    return !isEmpty ? (<SummaryTable title={messages.upcomingRewards} secondaryTitle={messages.audio} summaryValueColor='default' items={formatCooldownChallenges(cooldownChallenges)} summaryItem={summary}/>) : null;
};
