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
import type { ClaimableRewardNotificationActionData } from './ClaimableRewardNotificationActionData';
import {
    ClaimableRewardNotificationActionDataFromJSON,
    ClaimableRewardNotificationActionDataFromJSONTyped,
    ClaimableRewardNotificationActionDataToJSON,
} from './ClaimableRewardNotificationActionData';

/**
 * 
 * @export
 * @interface ClaimableRewardNotificationAction
 */
export interface ClaimableRewardNotificationAction {
    /**
     * 
     * @type {string}
     * @memberof ClaimableRewardNotificationAction
     */
    specifier: string;
    /**
     * 
     * @type {string}
     * @memberof ClaimableRewardNotificationAction
     */
    type: string;
    /**
     * 
     * @type {number}
     * @memberof ClaimableRewardNotificationAction
     */
    timestamp: number;
    /**
     * 
     * @type {ClaimableRewardNotificationActionData}
     * @memberof ClaimableRewardNotificationAction
     */
    data: ClaimableRewardNotificationActionData;
}

/**
 * Check if a given object implements the ClaimableRewardNotificationAction interface.
 */
export function instanceOfClaimableRewardNotificationAction(value: object): value is ClaimableRewardNotificationAction {
    let isInstance = true;
    isInstance = isInstance && "specifier" in value && value["specifier"] !== undefined;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "timestamp" in value && value["timestamp"] !== undefined;
    isInstance = isInstance && "data" in value && value["data"] !== undefined;

    return isInstance;
}

export function ClaimableRewardNotificationActionFromJSON(json: any): ClaimableRewardNotificationAction {
    return ClaimableRewardNotificationActionFromJSONTyped(json, false);
}

export function ClaimableRewardNotificationActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): ClaimableRewardNotificationAction {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'specifier': json['specifier'],
        'type': json['type'],
        'timestamp': json['timestamp'],
        'data': ClaimableRewardNotificationActionDataFromJSON(json['data']),
    };
}

export function ClaimableRewardNotificationActionToJSON(value?: ClaimableRewardNotificationAction | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'specifier': value.specifier,
        'type': value.type,
        'timestamp': value.timestamp,
        'data': ClaimableRewardNotificationActionDataToJSON(value.data),
    };
}
