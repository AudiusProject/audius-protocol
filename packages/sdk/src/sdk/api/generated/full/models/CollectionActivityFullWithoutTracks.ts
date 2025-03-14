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
import type { ActivityFull } from './ActivityFull';
import {
    ActivityFullFromJSON,
    ActivityFullFromJSONTyped,
    ActivityFullToJSON,
} from './ActivityFull';
import type { PlaylistFullWithoutTracks } from './PlaylistFullWithoutTracks';
import {
    PlaylistFullWithoutTracksFromJSON,
    PlaylistFullWithoutTracksFromJSONTyped,
    PlaylistFullWithoutTracksToJSON,
} from './PlaylistFullWithoutTracks';

/**
 * 
 * @export
 * @interface CollectionActivityFullWithoutTracks
 */
export interface CollectionActivityFullWithoutTracks extends ActivityFull {
    /**
     * 
     * @type {string}
     * @memberof CollectionActivityFullWithoutTracks
     */
    itemType: CollectionActivityFullWithoutTracksItemTypeEnum;
    /**
     * 
     * @type {PlaylistFullWithoutTracks}
     * @memberof CollectionActivityFullWithoutTracks
     */
    item: PlaylistFullWithoutTracks;
}


/**
 * @export
 */
export const CollectionActivityFullWithoutTracksItemTypeEnum = {
    Playlist: 'playlist'
} as const;
export type CollectionActivityFullWithoutTracksItemTypeEnum = typeof CollectionActivityFullWithoutTracksItemTypeEnum[keyof typeof CollectionActivityFullWithoutTracksItemTypeEnum];


/**
 * Check if a given object implements the CollectionActivityFullWithoutTracks interface.
 */
export function instanceOfCollectionActivityFullWithoutTracks(value: object): value is CollectionActivityFullWithoutTracks {
    let isInstance = true;
    isInstance = isInstance && "itemType" in value && value["itemType"] !== undefined;
    isInstance = isInstance && "item" in value && value["item"] !== undefined;

    return isInstance;
}

export function CollectionActivityFullWithoutTracksFromJSON(json: any): CollectionActivityFullWithoutTracks {
    return CollectionActivityFullWithoutTracksFromJSONTyped(json, false);
}

export function CollectionActivityFullWithoutTracksFromJSONTyped(json: any, ignoreDiscriminator: boolean): CollectionActivityFullWithoutTracks {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        ...ActivityFullFromJSONTyped(json, ignoreDiscriminator),
        'itemType': json['item_type'],
        'item': PlaylistFullWithoutTracksFromJSON(json['item']),
    };
}

export function CollectionActivityFullWithoutTracksToJSON(value?: CollectionActivityFullWithoutTracks | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        ...ActivityFullToJSON(value),
        'item_type': value.itemType,
        'item': PlaylistFullWithoutTracksToJSON(value.item),
    };
}

