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
 * @interface PlaylistArtworkFull
 */
export interface PlaylistArtworkFull {
    /**
     * 
     * @type {string}
     * @memberof PlaylistArtworkFull
     */
    _150x150?: string;
    /**
     * 
     * @type {string}
     * @memberof PlaylistArtworkFull
     */
    _480x480?: string;
    /**
     * 
     * @type {string}
     * @memberof PlaylistArtworkFull
     */
    _1000x1000?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof PlaylistArtworkFull
     */
    mirrors?: Array<string>;
}

/**
 * Check if a given object implements the PlaylistArtworkFull interface.
 */
export function instanceOfPlaylistArtworkFull(value: object): value is PlaylistArtworkFull {
    let isInstance = true;

    return isInstance;
}

export function PlaylistArtworkFullFromJSON(json: any): PlaylistArtworkFull {
    return PlaylistArtworkFullFromJSONTyped(json, false);
}

export function PlaylistArtworkFullFromJSONTyped(json: any, ignoreDiscriminator: boolean): PlaylistArtworkFull {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        '_150x150': !exists(json, '150x150') ? undefined : json['150x150'],
        '_480x480': !exists(json, '480x480') ? undefined : json['480x480'],
        '_1000x1000': !exists(json, '1000x1000') ? undefined : json['1000x1000'],
        'mirrors': !exists(json, 'mirrors') ? undefined : json['mirrors'],
    };
}

export function PlaylistArtworkFullToJSON(value?: PlaylistArtworkFull | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        '150x150': value._150x150,
        '480x480': value._480x480,
        '1000x1000': value._1000x1000,
        'mirrors': value.mirrors,
    };
}
