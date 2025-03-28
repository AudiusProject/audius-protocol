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
 * @interface CreateTrackNotificationActionData
 */
export interface CreateTrackNotificationActionData {
    /**
     * 
     * @type {string}
     * @memberof CreateTrackNotificationActionData
     */
    trackId: string;
}

/**
 * Check if a given object implements the CreateTrackNotificationActionData interface.
 */
export function instanceOfCreateTrackNotificationActionData(value: object): value is CreateTrackNotificationActionData {
    let isInstance = true;
    isInstance = isInstance && "trackId" in value && value["trackId"] !== undefined;

    return isInstance;
}

export function CreateTrackNotificationActionDataFromJSON(json: any): CreateTrackNotificationActionData {
    return CreateTrackNotificationActionDataFromJSONTyped(json, false);
}

export function CreateTrackNotificationActionDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateTrackNotificationActionData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'trackId': json['track_id'],
    };
}

export function CreateTrackNotificationActionDataToJSON(value?: CreateTrackNotificationActionData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'track_id': value.trackId,
    };
}

