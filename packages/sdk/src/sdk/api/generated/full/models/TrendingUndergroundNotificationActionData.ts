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
 * @interface TrendingUndergroundNotificationActionData
 */
export interface TrendingUndergroundNotificationActionData {
    /**
     * 
     * @type {number}
     * @memberof TrendingUndergroundNotificationActionData
     */
    rank: number;
    /**
     * 
     * @type {string}
     * @memberof TrendingUndergroundNotificationActionData
     */
    genre: string;
    /**
     * 
     * @type {string}
     * @memberof TrendingUndergroundNotificationActionData
     */
    trackId: string;
    /**
     * 
     * @type {string}
     * @memberof TrendingUndergroundNotificationActionData
     */
    timeRange: TrendingUndergroundNotificationActionDataTimeRangeEnum;
}


/**
 * @export
 */
export const TrendingUndergroundNotificationActionDataTimeRangeEnum = {
    Week: 'week',
    Month: 'month',
    Year: 'year'
} as const;
export type TrendingUndergroundNotificationActionDataTimeRangeEnum = typeof TrendingUndergroundNotificationActionDataTimeRangeEnum[keyof typeof TrendingUndergroundNotificationActionDataTimeRangeEnum];


/**
 * Check if a given object implements the TrendingUndergroundNotificationActionData interface.
 */
export function instanceOfTrendingUndergroundNotificationActionData(value: object): value is TrendingUndergroundNotificationActionData {
    let isInstance = true;
    isInstance = isInstance && "rank" in value && value["rank"] !== undefined;
    isInstance = isInstance && "genre" in value && value["genre"] !== undefined;
    isInstance = isInstance && "trackId" in value && value["trackId"] !== undefined;
    isInstance = isInstance && "timeRange" in value && value["timeRange"] !== undefined;

    return isInstance;
}

export function TrendingUndergroundNotificationActionDataFromJSON(json: any): TrendingUndergroundNotificationActionData {
    return TrendingUndergroundNotificationActionDataFromJSONTyped(json, false);
}

export function TrendingUndergroundNotificationActionDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): TrendingUndergroundNotificationActionData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'rank': json['rank'],
        'genre': json['genre'],
        'trackId': json['track_id'],
        'timeRange': json['time_range'],
    };
}

export function TrendingUndergroundNotificationActionDataToJSON(value?: TrendingUndergroundNotificationActionData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'rank': value.rank,
        'genre': value.genre,
        'track_id': value.trackId,
        'time_range': value.timeRange,
    };
}

