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
 * @interface ArtistRemixContestEndedNotificationActionData
 */
export interface ArtistRemixContestEndedNotificationActionData {
    /**
     * 
     * @type {string}
     * @memberof ArtistRemixContestEndedNotificationActionData
     */
    entityId: string;
}

/**
 * Check if a given object implements the ArtistRemixContestEndedNotificationActionData interface.
 */
export function instanceOfArtistRemixContestEndedNotificationActionData(value: object): value is ArtistRemixContestEndedNotificationActionData {
    let isInstance = true;
    isInstance = isInstance && "entityId" in value && value["entityId"] !== undefined;

    return isInstance;
}

export function ArtistRemixContestEndedNotificationActionDataFromJSON(json: any): ArtistRemixContestEndedNotificationActionData {
    return ArtistRemixContestEndedNotificationActionDataFromJSONTyped(json, false);
}

export function ArtistRemixContestEndedNotificationActionDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): ArtistRemixContestEndedNotificationActionData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'entityId': json['entity_id'],
    };
}

export function ArtistRemixContestEndedNotificationActionDataToJSON(value?: ArtistRemixContestEndedNotificationActionData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'entity_id': value.entityId,
    };
}

