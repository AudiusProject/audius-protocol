/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
/**
 * API
 * Audius V1 API
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
 * @interface RemixedTrackAggregate
 */
export interface RemixedTrackAggregate {
    /**
     * 
     * @type {string}
     * @memberof RemixedTrackAggregate
     */
    trackId: string;
    /**
     * 
     * @type {string}
     * @memberof RemixedTrackAggregate
     */
    title: string;
    /**
     * 
     * @type {number}
     * @memberof RemixedTrackAggregate
     */
    remixCount: number;
}

/**
 * Check if a given object implements the RemixedTrackAggregate interface.
 */
export function instanceOfRemixedTrackAggregate(value: object): value is RemixedTrackAggregate {
    let isInstance = true;
    isInstance = isInstance && "trackId" in value && value["trackId"] !== undefined;
    isInstance = isInstance && "title" in value && value["title"] !== undefined;
    isInstance = isInstance && "remixCount" in value && value["remixCount"] !== undefined;

    return isInstance;
}

export function RemixedTrackAggregateFromJSON(json: any): RemixedTrackAggregate {
    return RemixedTrackAggregateFromJSONTyped(json, false);
}

export function RemixedTrackAggregateFromJSONTyped(json: any, ignoreDiscriminator: boolean): RemixedTrackAggregate {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'trackId': json['track_id'],
        'title': json['title'],
        'remixCount': json['remix_count'],
    };
}

export function RemixedTrackAggregateToJSON(value?: RemixedTrackAggregate | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'track_id': value.trackId,
        'title': value.title,
        'remix_count': value.remixCount,
    };
}
