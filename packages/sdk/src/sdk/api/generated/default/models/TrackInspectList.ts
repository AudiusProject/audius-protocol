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
import type { BlobInfo } from './BlobInfo';
import {
    BlobInfoFromJSON,
    BlobInfoFromJSONTyped,
    BlobInfoToJSON,
} from './BlobInfo';

/**
 * 
 * @export
 * @interface TrackInspectList
 */
export interface TrackInspectList {
    /**
     * 
     * @type {Array<BlobInfo>}
     * @memberof TrackInspectList
     */
    data?: Array<BlobInfo>;
}

/**
 * Check if a given object implements the TrackInspectList interface.
 */
export function instanceOfTrackInspectList(value: object): value is TrackInspectList {
    let isInstance = true;

    return isInstance;
}

export function TrackInspectListFromJSON(json: any): TrackInspectList {
    return TrackInspectListFromJSONTyped(json, false);
}

export function TrackInspectListFromJSONTyped(json: any, ignoreDiscriminator: boolean): TrackInspectList {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : ((json['data'] as Array<any>).map(BlobInfoFromJSON)),
    };
}

export function TrackInspectListToJSON(value?: TrackInspectList | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data === undefined ? undefined : ((value.data as Array<any>).map(BlobInfoToJSON)),
    };
}

