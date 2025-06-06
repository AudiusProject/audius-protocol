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
 * @interface AlbumBacklink
 */
export interface AlbumBacklink {
    /**
     * 
     * @type {number}
     * @memberof AlbumBacklink
     */
    playlistId: number;
    /**
     * 
     * @type {string}
     * @memberof AlbumBacklink
     */
    playlistName: string;
    /**
     * 
     * @type {string}
     * @memberof AlbumBacklink
     */
    permalink: string;
}

/**
 * Check if a given object implements the AlbumBacklink interface.
 */
export function instanceOfAlbumBacklink(value: object): value is AlbumBacklink {
    let isInstance = true;
    isInstance = isInstance && "playlistId" in value && value["playlistId"] !== undefined;
    isInstance = isInstance && "playlistName" in value && value["playlistName"] !== undefined;
    isInstance = isInstance && "permalink" in value && value["permalink"] !== undefined;

    return isInstance;
}

export function AlbumBacklinkFromJSON(json: any): AlbumBacklink {
    return AlbumBacklinkFromJSONTyped(json, false);
}

export function AlbumBacklinkFromJSONTyped(json: any, ignoreDiscriminator: boolean): AlbumBacklink {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'playlistId': json['playlist_id'],
        'playlistName': json['playlist_name'],
        'permalink': json['permalink'],
    };
}

export function AlbumBacklinkToJSON(value?: AlbumBacklink | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'playlist_id': value.playlistId,
        'playlist_name': value.playlistName,
        'permalink': value.permalink,
    };
}

