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
import type { Playlist } from './Playlist';
import {
    PlaylistFromJSON,
    PlaylistFromJSONTyped,
    PlaylistToJSON,
} from './Playlist';

/**
 * 
 * @export
 * @interface PlaylistsResponse
 */
export interface PlaylistsResponse {
    /**
     * 
     * @type {Array<Playlist>}
     * @memberof PlaylistsResponse
     */
    data?: Array<Playlist>;
}

/**
 * Check if a given object implements the PlaylistsResponse interface.
 */
export function instanceOfPlaylistsResponse(value: object): value is PlaylistsResponse {
    let isInstance = true;

    return isInstance;
}

export function PlaylistsResponseFromJSON(json: any): PlaylistsResponse {
    return PlaylistsResponseFromJSONTyped(json, false);
}

export function PlaylistsResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): PlaylistsResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : ((json['data'] as Array<any>).map(PlaylistFromJSON)),
    };
}

export function PlaylistsResponseToJSON(value?: PlaylistsResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data === undefined ? undefined : ((value.data as Array<any>).map(PlaylistToJSON)),
    };
}

