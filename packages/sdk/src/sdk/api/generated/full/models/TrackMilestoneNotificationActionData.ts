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
/**
 * 
 * @export
 * @interface TrackMilestoneNotificationActionData
 */
export interface TrackMilestoneNotificationActionData {
    /**
     * 
     * @type {string}
     * @memberof TrackMilestoneNotificationActionData
     */
    type: string;
    /**
     * 
     * @type {number}
     * @memberof TrackMilestoneNotificationActionData
     */
    threshold: number;
    /**
     * 
     * @type {string}
     * @memberof TrackMilestoneNotificationActionData
     */
    trackId: string;
}

/**
 * Check if a given object implements the TrackMilestoneNotificationActionData interface.
 */
export function instanceOfTrackMilestoneNotificationActionData(value: object): value is TrackMilestoneNotificationActionData {
    let isInstance = true;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "threshold" in value && value["threshold"] !== undefined;
    isInstance = isInstance && "trackId" in value && value["trackId"] !== undefined;

    return isInstance;
}

export function TrackMilestoneNotificationActionDataFromJSON(json: any): TrackMilestoneNotificationActionData {
    return TrackMilestoneNotificationActionDataFromJSONTyped(json, false);
}

export function TrackMilestoneNotificationActionDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): TrackMilestoneNotificationActionData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'type': json['type'],
        'threshold': json['threshold'],
        'trackId': json['track_id'],
    };
}

export function TrackMilestoneNotificationActionDataToJSON(value?: TrackMilestoneNotificationActionData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'type': value.type,
        'threshold': value.threshold,
        'track_id': value.trackId,
    };
}

