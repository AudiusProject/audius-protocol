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
 * @interface PlaylistUpdate
 */
export interface PlaylistUpdate {
    /**
     * 
     * @type {string}
     * @memberof PlaylistUpdate
     */
    playlistId: string;
    /**
     * 
     * @type {number}
     * @memberof PlaylistUpdate
     */
    updatedAt: number;
    /**
     * 
     * @type {number}
     * @memberof PlaylistUpdate
     */
    lastSeenAt?: number;
}

/**
 * Check if a given object implements the PlaylistUpdate interface.
 */
export function instanceOfPlaylistUpdate(value: object): value is PlaylistUpdate {
    let isInstance = true;
    isInstance = isInstance && "playlistId" in value && value["playlistId"] !== undefined;
    isInstance = isInstance && "updatedAt" in value && value["updatedAt"] !== undefined;

    return isInstance;
}

export function PlaylistUpdateFromJSON(json: any): PlaylistUpdate {
    return PlaylistUpdateFromJSONTyped(json, false);
}

export function PlaylistUpdateFromJSONTyped(json: any, ignoreDiscriminator: boolean): PlaylistUpdate {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'playlistId': json['playlist_id'],
        'updatedAt': json['updated_at'],
        'lastSeenAt': !exists(json, 'last_seen_at') ? undefined : json['last_seen_at'],
    };
}

export function PlaylistUpdateToJSON(value?: PlaylistUpdate | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'playlist_id': value.playlistId,
        'updated_at': value.updatedAt,
        'last_seen_at': value.lastSeenAt,
    };
}
