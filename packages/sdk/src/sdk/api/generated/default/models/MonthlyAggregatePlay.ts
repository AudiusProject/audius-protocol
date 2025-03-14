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
import type { ListenCount } from './ListenCount';
import {
    ListenCountFromJSON,
    ListenCountFromJSONTyped,
    ListenCountToJSON,
} from './ListenCount';

/**
 * 
 * @export
 * @interface MonthlyAggregatePlay
 */
export interface MonthlyAggregatePlay {
    /**
     * 
     * @type {number}
     * @memberof MonthlyAggregatePlay
     */
    totalListens?: number;
    /**
     * 
     * @type {Array<number>}
     * @memberof MonthlyAggregatePlay
     */
    trackIds?: Array<number>;
    /**
     * 
     * @type {Array<ListenCount>}
     * @memberof MonthlyAggregatePlay
     */
    listenCounts?: Array<ListenCount>;
}

/**
 * Check if a given object implements the MonthlyAggregatePlay interface.
 */
export function instanceOfMonthlyAggregatePlay(value: object): value is MonthlyAggregatePlay {
    let isInstance = true;

    return isInstance;
}

export function MonthlyAggregatePlayFromJSON(json: any): MonthlyAggregatePlay {
    return MonthlyAggregatePlayFromJSONTyped(json, false);
}

export function MonthlyAggregatePlayFromJSONTyped(json: any, ignoreDiscriminator: boolean): MonthlyAggregatePlay {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'totalListens': !exists(json, 'totalListens') ? undefined : json['totalListens'],
        'trackIds': !exists(json, 'trackIds') ? undefined : json['trackIds'],
        'listenCounts': !exists(json, 'listenCounts') ? undefined : ((json['listenCounts'] as Array<any>).map(ListenCountFromJSON)),
    };
}

export function MonthlyAggregatePlayToJSON(value?: MonthlyAggregatePlay | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'totalListens': value.totalListens,
        'trackIds': value.trackIds,
        'listenCounts': value.listenCounts === undefined ? undefined : ((value.listenCounts as Array<any>).map(ListenCountToJSON)),
    };
}

