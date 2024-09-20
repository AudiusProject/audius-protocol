import { IntKeys } from '@audius/common/services';
import { track } from 'app/services/analytics';
import { EventNames } from 'app/types/analytics';
import { remoteConfigInstance } from './remote-config/remote-config-instance';
/**
 * Given an integer-percent value (e.g. 45), whether or not based on random chance,
 * we should record
 * @param percent
 */
var shouldRecord = function (percent) {
    return Math.random() <= percent / 100.0;
};
var healthCheck = function (payload, type) {
    var sampleRate = remoteConfigInstance.getRemoteVar(IntKeys.SERVICE_MONITOR_HEALTH_CHECK_SAMPLE_RATE) || 0;
    if (shouldRecord(sampleRate)) {
        payload.type = type;
        track({
            eventName: EventNames.SERVICE_MONITOR_HEALTH_CHECK,
            properties: payload
        });
    }
};
var request = function (payload, type) {
    var sampleRate = remoteConfigInstance.getRemoteVar(IntKeys.SERVICE_MONITOR_REQUEST_SAMPLE_RATE) || 0;
    if (shouldRecord(sampleRate)) {
        payload.type = type;
        track({
            eventName: EventNames.SERVICE_MONITOR_REQUEST,
            properties: payload
        });
    }
};
var discoveryNode = {
    healthCheck: function (payload) {
        return healthCheck(payload, 'discovery-node');
    },
    request: function (payload) { return request(payload, 'discovery-node'); }
};
var contentNode = {
    healthCheck: function (payload) {
        return healthCheck(payload, 'content-node');
    },
    request: function (payload) { return request(payload, 'content-node'); }
};
export var monitoringCallbacks = {
    discoveryNode: discoveryNode,
    contentNode: contentNode
};
