/* tslint:disable */
// @ts-nocheck
/* eslint-disable */
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


import * as runtime from '../runtime';
import type {
  SearchAutocompleteResponse,
  SearchFullResponse,
} from '../models';
import {
    SearchAutocompleteResponseFromJSON,
    SearchAutocompleteResponseToJSON,
    SearchFullResponseFromJSON,
    SearchFullResponseToJSON,
} from '../models';

export interface SearchRequest {
    query: string;
    offset?: number;
    limit?: number;
    userId?: string;
    kind?: SearchKindEnum;
    includePurchaseable?: string;
}

export interface SearchAutocompleteRequest {
    query: string;
    offset?: number;
    limit?: number;
    userId?: string;
    kind?: SearchAutocompleteKindEnum;
    includePurchaseable?: string;
}

/**
 * 
 */
export class SearchApi extends runtime.BaseAPI {

    /**
     * @hidden
     * Get Users/Tracks/Playlists/Albums that best match the search query
     */
    async searchRaw(params: SearchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SearchFullResponse>> {
        if (params.query === null || params.query === undefined) {
            throw new runtime.RequiredError('query','Required parameter params.query was null or undefined when calling search.');
        }

        const queryParameters: any = {};

        if (params.offset !== undefined) {
            queryParameters['offset'] = params.offset;
        }

        if (params.limit !== undefined) {
            queryParameters['limit'] = params.limit;
        }

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        if (params.query !== undefined) {
            queryParameters['query'] = params.query;
        }

        if (params.kind !== undefined) {
            queryParameters['kind'] = params.kind;
        }

        if (params.includePurchaseable !== undefined) {
            queryParameters['includePurchaseable'] = params.includePurchaseable;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/search/full`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SearchFullResponseFromJSON(jsonValue));
    }

    /**
     * Get Users/Tracks/Playlists/Albums that best match the search query
     */
    async search(params: SearchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SearchFullResponse> {
        const response = await this.searchRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Same as search but optimized for quicker response at the cost of some entity information.
     * Get Users/Tracks/Playlists/Albums that best match the search query
     */
    async searchAutocompleteRaw(params: SearchAutocompleteRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SearchAutocompleteResponse>> {
        if (params.query === null || params.query === undefined) {
            throw new runtime.RequiredError('query','Required parameter params.query was null or undefined when calling searchAutocomplete.');
        }

        const queryParameters: any = {};

        if (params.offset !== undefined) {
            queryParameters['offset'] = params.offset;
        }

        if (params.limit !== undefined) {
            queryParameters['limit'] = params.limit;
        }

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        if (params.query !== undefined) {
            queryParameters['query'] = params.query;
        }

        if (params.kind !== undefined) {
            queryParameters['kind'] = params.kind;
        }

        if (params.includePurchaseable !== undefined) {
            queryParameters['includePurchaseable'] = params.includePurchaseable;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/search/autocomplete`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SearchAutocompleteResponseFromJSON(jsonValue));
    }

    /**
     * Same as search but optimized for quicker response at the cost of some entity information.
     * Get Users/Tracks/Playlists/Albums that best match the search query
     */
    async searchAutocomplete(params: SearchAutocompleteRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SearchAutocompleteResponse> {
        const response = await this.searchAutocompleteRaw(params, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const SearchKindEnum = {
    All: 'all',
    Users: 'users',
    Tracks: 'tracks',
    Playlists: 'playlists',
    Albums: 'albums'
} as const;
export type SearchKindEnum = typeof SearchKindEnum[keyof typeof SearchKindEnum];
/**
 * @export
 */
export const SearchAutocompleteKindEnum = {
    All: 'all',
    Users: 'users',
    Tracks: 'tracks',
    Playlists: 'playlists',
    Albums: 'albums'
} as const;
export type SearchAutocompleteKindEnum = typeof SearchAutocompleteKindEnum[keyof typeof SearchAutocompleteKindEnum];
