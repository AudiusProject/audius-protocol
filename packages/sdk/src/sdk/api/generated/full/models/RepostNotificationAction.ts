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
import type { RepostNotificationActionData } from './RepostNotificationActionData';
import {
    RepostNotificationActionDataFromJSON,
    RepostNotificationActionDataFromJSONTyped,
    RepostNotificationActionDataToJSON,
} from './RepostNotificationActionData';

/**
 * 
 * @export
 * @interface RepostNotificationAction
 */
export interface RepostNotificationAction {
    /**
     * 
     * @type {string}
     * @memberof RepostNotificationAction
     */
    specifier: string;
    /**
     * 
     * @type {string}
     * @memberof RepostNotificationAction
     */
    type: string;
    /**
     * 
     * @type {number}
     * @memberof RepostNotificationAction
     */
    timestamp: number;
    /**
     * 
     * @type {RepostNotificationActionData}
     * @memberof RepostNotificationAction
     */
    data: RepostNotificationActionData;
}

/**
 * Check if a given object implements the RepostNotificationAction interface.
 */
export function instanceOfRepostNotificationAction(value: object): value is RepostNotificationAction {
    let isInstance = true;
    isInstance = isInstance && "specifier" in value && value["specifier"] !== undefined;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "timestamp" in value && value["timestamp"] !== undefined;
    isInstance = isInstance && "data" in value && value["data"] !== undefined;

    return isInstance;
}

export function RepostNotificationActionFromJSON(json: any): RepostNotificationAction {
    return RepostNotificationActionFromJSONTyped(json, false);
}

export function RepostNotificationActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): RepostNotificationAction {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'specifier': json['specifier'],
        'type': json['type'],
        'timestamp': json['timestamp'],
        'data': RepostNotificationActionDataFromJSON(json['data']),
    };
}

export function RepostNotificationActionToJSON(value?: RepostNotificationAction | null): any {
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
        'data': RepostNotificationActionDataToJSON(value.data),
    };
}

