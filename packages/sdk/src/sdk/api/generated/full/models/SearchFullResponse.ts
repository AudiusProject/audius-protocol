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
import type { SearchModel } from './SearchModel';
import {
    SearchModelFromJSON,
    SearchModelFromJSONTyped,
    SearchModelToJSON,
} from './SearchModel';
import type { VersionMetadata } from './VersionMetadata';
import {
    VersionMetadataFromJSON,
    VersionMetadataFromJSONTyped,
    VersionMetadataToJSON,
} from './VersionMetadata';

/**
 * 
 * @export
 * @interface SearchFullResponse
 */
export interface SearchFullResponse {
    /**
     * 
     * @type {number}
     * @memberof SearchFullResponse
     */
    latestChainBlock: number;
    /**
     * 
     * @type {number}
     * @memberof SearchFullResponse
     */
    latestIndexedBlock: number;
    /**
     * 
     * @type {number}
     * @memberof SearchFullResponse
     */
    latestChainSlotPlays: number;
    /**
     * 
     * @type {number}
     * @memberof SearchFullResponse
     */
    latestIndexedSlotPlays: number;
    /**
     * 
     * @type {string}
     * @memberof SearchFullResponse
     */
    signature: string;
    /**
     * 
     * @type {string}
     * @memberof SearchFullResponse
     */
    timestamp: string;
    /**
     * 
     * @type {VersionMetadata}
     * @memberof SearchFullResponse
     */
    version: VersionMetadata;
    /**
     * 
     * @type {SearchModel}
     * @memberof SearchFullResponse
     */
    data?: SearchModel;
}

/**
 * Check if a given object implements the SearchFullResponse interface.
 */
export function instanceOfSearchFullResponse(value: object): value is SearchFullResponse {
    let isInstance = true;
    isInstance = isInstance && "latestChainBlock" in value && value["latestChainBlock"] !== undefined;
    isInstance = isInstance && "latestIndexedBlock" in value && value["latestIndexedBlock"] !== undefined;
    isInstance = isInstance && "latestChainSlotPlays" in value && value["latestChainSlotPlays"] !== undefined;
    isInstance = isInstance && "latestIndexedSlotPlays" in value && value["latestIndexedSlotPlays"] !== undefined;
    isInstance = isInstance && "signature" in value && value["signature"] !== undefined;
    isInstance = isInstance && "timestamp" in value && value["timestamp"] !== undefined;
    isInstance = isInstance && "version" in value && value["version"] !== undefined;

    return isInstance;
}

export function SearchFullResponseFromJSON(json: any): SearchFullResponse {
    return SearchFullResponseFromJSONTyped(json, false);
}

export function SearchFullResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): SearchFullResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'latestChainBlock': json['latest_chain_block'],
        'latestIndexedBlock': json['latest_indexed_block'],
        'latestChainSlotPlays': json['latest_chain_slot_plays'],
        'latestIndexedSlotPlays': json['latest_indexed_slot_plays'],
        'signature': json['signature'],
        'timestamp': json['timestamp'],
        'version': VersionMetadataFromJSON(json['version']),
        'data': !exists(json, 'data') ? undefined : SearchModelFromJSON(json['data']),
    };
}

export function SearchFullResponseToJSON(value?: SearchFullResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'latest_chain_block': value.latestChainBlock,
        'latest_indexed_block': value.latestIndexedBlock,
        'latest_chain_slot_plays': value.latestChainSlotPlays,
        'latest_indexed_slot_plays': value.latestIndexedSlotPlays,
        'signature': value.signature,
        'timestamp': value.timestamp,
        'version': VersionMetadataToJSON(value.version),
        'data': SearchModelToJSON(value.data),
    };
}

