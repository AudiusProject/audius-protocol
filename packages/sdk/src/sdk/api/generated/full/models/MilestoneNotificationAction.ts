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
import type { MilestoneNotificationActionData } from './MilestoneNotificationActionData';
import {
    MilestoneNotificationActionDataFromJSON,
    MilestoneNotificationActionDataFromJSONTyped,
    MilestoneNotificationActionDataToJSON,
} from './MilestoneNotificationActionData';

/**
 * 
 * @export
 * @interface MilestoneNotificationAction
 */
export interface MilestoneNotificationAction {
    /**
     * 
     * @type {string}
     * @memberof MilestoneNotificationAction
     */
    specifier: string;
    /**
     * 
     * @type {string}
     * @memberof MilestoneNotificationAction
     */
    type: string;
    /**
     * 
     * @type {number}
     * @memberof MilestoneNotificationAction
     */
    timestamp: number;
    /**
     * 
     * @type {MilestoneNotificationActionData}
     * @memberof MilestoneNotificationAction
     */
    data: MilestoneNotificationActionData;
}

/**
 * Check if a given object implements the MilestoneNotificationAction interface.
 */
export function instanceOfMilestoneNotificationAction(value: object): value is MilestoneNotificationAction {
    let isInstance = true;
    isInstance = isInstance && "specifier" in value && value["specifier"] !== undefined;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "timestamp" in value && value["timestamp"] !== undefined;
    isInstance = isInstance && "data" in value && value["data"] !== undefined;

    return isInstance;
}

export function MilestoneNotificationActionFromJSON(json: any): MilestoneNotificationAction {
    return MilestoneNotificationActionFromJSONTyped(json, false);
}

export function MilestoneNotificationActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): MilestoneNotificationAction {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'specifier': json['specifier'],
        'type': json['type'],
        'timestamp': json['timestamp'],
        'data': MilestoneNotificationActionDataFromJSON(json['data']),
    };
}

export function MilestoneNotificationActionToJSON(value?: MilestoneNotificationAction | null): any {
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
        'data': MilestoneNotificationActionDataToJSON(value.data),
    };
}
