/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
/**
 * API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { ClaimableRewardNotificationAction } from './ClaimableRewardNotificationAction';
import {
    ClaimableRewardNotificationActionFromJSON,
    ClaimableRewardNotificationActionFromJSONTyped,
    ClaimableRewardNotificationActionToJSON,
} from './ClaimableRewardNotificationAction';

/**
 * 
 * @export
 * @interface ClaimableRewardNotification
 */
export interface ClaimableRewardNotification {
    /**
     * 
     * @type {string}
     * @memberof ClaimableRewardNotification
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof ClaimableRewardNotification
     */
    groupId: string;
    /**
     * 
     * @type {boolean}
     * @memberof ClaimableRewardNotification
     */
    isSeen: boolean;
    /**
     * 
     * @type {number}
     * @memberof ClaimableRewardNotification
     */
    seenAt?: number;
    /**
     * 
     * @type {Array<ClaimableRewardNotificationAction>}
     * @memberof ClaimableRewardNotification
     */
    actions: Array<ClaimableRewardNotificationAction>;
}

/**
 * Check if a given object implements the ClaimableRewardNotification interface.
 */
export function instanceOfClaimableRewardNotification(value: object): value is ClaimableRewardNotification {
    let isInstance = true;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "groupId" in value && value["groupId"] !== undefined;
    isInstance = isInstance && "isSeen" in value && value["isSeen"] !== undefined;
    isInstance = isInstance && "actions" in value && value["actions"] !== undefined;

    return isInstance;
}

export function ClaimableRewardNotificationFromJSON(json: any): ClaimableRewardNotification {
    return ClaimableRewardNotificationFromJSONTyped(json, false);
}

export function ClaimableRewardNotificationFromJSONTyped(json: any, ignoreDiscriminator: boolean): ClaimableRewardNotification {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'type': json['type'],
        'groupId': json['group_id'],
        'isSeen': json['is_seen'],
        'seenAt': !exists(json, 'seen_at') ? undefined : json['seen_at'],
        'actions': ((json['actions'] as Array<any>).map(ClaimableRewardNotificationActionFromJSON)),
    };
}

export function ClaimableRewardNotificationToJSON(value?: ClaimableRewardNotification | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'type': value.type,
        'group_id': value.groupId,
        'is_seen': value.isSeen,
        'seen_at': value.seenAt,
        'actions': ((value.actions as Array<any>).map(ClaimableRewardNotificationActionToJSON)),
    };
}
