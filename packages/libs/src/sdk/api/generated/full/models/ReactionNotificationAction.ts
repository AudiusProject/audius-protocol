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
import type { ReactionNotificationActionData } from './ReactionNotificationActionData';
import {
    ReactionNotificationActionDataFromJSON,
    ReactionNotificationActionDataFromJSONTyped,
    ReactionNotificationActionDataToJSON,
} from './ReactionNotificationActionData';

/**
 * 
 * @export
 * @interface ReactionNotificationAction
 */
export interface ReactionNotificationAction {
    /**
     * 
     * @type {string}
     * @memberof ReactionNotificationAction
     */
    specifier: string;
    /**
     * 
     * @type {string}
     * @memberof ReactionNotificationAction
     */
    type: string;
    /**
     * 
     * @type {number}
     * @memberof ReactionNotificationAction
     */
    timestamp: number;
    /**
     * 
     * @type {ReactionNotificationActionData}
     * @memberof ReactionNotificationAction
     */
    data: ReactionNotificationActionData;
}

/**
 * Check if a given object implements the ReactionNotificationAction interface.
 */
export function instanceOfReactionNotificationAction(value: object): value is ReactionNotificationAction {
    let isInstance = true;
    isInstance = isInstance && "specifier" in value && value["specifier"] !== undefined;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "timestamp" in value && value["timestamp"] !== undefined;
    isInstance = isInstance && "data" in value && value["data"] !== undefined;

    return isInstance;
}

export function ReactionNotificationActionFromJSON(json: any): ReactionNotificationAction {
    return ReactionNotificationActionFromJSONTyped(json, false);
}

export function ReactionNotificationActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): ReactionNotificationAction {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'specifier': json['specifier'],
        'type': json['type'],
        'timestamp': json['timestamp'],
        'data': ReactionNotificationActionDataFromJSON(json['data']),
    };
}

export function ReactionNotificationActionToJSON(value?: ReactionNotificationAction | null): any {
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
        'data': ReactionNotificationActionDataToJSON(value.data),
    };
}
