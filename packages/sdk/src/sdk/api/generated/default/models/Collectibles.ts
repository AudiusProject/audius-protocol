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
 * @interface Collectibles
 */
export interface Collectibles {
    /**
     * Raw collectibles JSON structure generated by client
     * @type {object}
     * @memberof Collectibles
     */
    data?: object;
}

/**
 * Check if a given object implements the Collectibles interface.
 */
export function instanceOfCollectibles(value: object): value is Collectibles {
    let isInstance = true;

    return isInstance;
}

export function CollectiblesFromJSON(json: any): Collectibles {
    return CollectiblesFromJSONTyped(json, false);
}

export function CollectiblesFromJSONTyped(json: any, ignoreDiscriminator: boolean): Collectibles {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : json['data'],
    };
}

export function CollectiblesToJSON(value?: Collectibles | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data,
    };
}

