/* tslint:disable */
// @ts-nocheck
/* eslint-disable */
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


import * as runtime from '../runtime';
import type {
  AccessInfoResponse,
  PlaylistResponse,
  PlaylistSearchResult,
  PlaylistTracksResponse,
  TrendingPlaylistsResponse,
} from '../models';
import {
    AccessInfoResponseFromJSON,
    AccessInfoResponseToJSON,
    PlaylistResponseFromJSON,
    PlaylistResponseToJSON,
    PlaylistSearchResultFromJSON,
    PlaylistSearchResultToJSON,
    PlaylistTracksResponseFromJSON,
    PlaylistTracksResponseToJSON,
    TrendingPlaylistsResponseFromJSON,
    TrendingPlaylistsResponseToJSON,
} from '../models';

export interface GetBulkPlaylistsRequest {
    userId?: string;
    id?: Array<string>;
}

export interface GetPlaylistRequest {
    playlistId: string;
    userId?: string;
}

export interface GetPlaylistAccessInfoRequest {
    playlistId: string;
    userId?: string;
}

export interface GetPlaylistByHandleAndSlugRequest {
    handle: string;
    slug: string;
    userId?: string;
}

export interface GetPlaylistTracksRequest {
    playlistId: string;
}

export interface GetTrendingPlaylistsRequest {
    time?: GetTrendingPlaylistsTimeEnum;
}

export interface SearchPlaylistsRequest {
    query?: string;
    genre?: Array<string>;
    sortMethod?: SearchPlaylistsSortMethodEnum;
    mood?: Array<string>;
    includePurchaseable?: string;
    hasDownloads?: string;
}

/**
 * 
 */
export class PlaylistsApi extends runtime.BaseAPI {

    /**
     * @hidden
     * Gets a list of playlists by ID
     */
    async getBulkPlaylistsRaw(params: GetBulkPlaylistsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PlaylistResponse>> {
        const queryParameters: any = {};

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        if (params.id) {
            queryParameters['id'] = params.id;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PlaylistResponseFromJSON(jsonValue));
    }

    /**
     * Gets a list of playlists by ID
     */
    async getBulkPlaylists(params: GetBulkPlaylistsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PlaylistResponse> {
        const response = await this.getBulkPlaylistsRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Get a playlist by ID
     */
    async getPlaylistRaw(params: GetPlaylistRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PlaylistResponse>> {
        if (params.playlistId === null || params.playlistId === undefined) {
            throw new runtime.RequiredError('playlistId','Required parameter params.playlistId was null or undefined when calling getPlaylist.');
        }

        const queryParameters: any = {};

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists/{playlist_id}`.replace(`{${"playlist_id"}}`, encodeURIComponent(String(params.playlistId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PlaylistResponseFromJSON(jsonValue));
    }

    /**
     * Get a playlist by ID
     */
    async getPlaylist(params: GetPlaylistRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PlaylistResponse> {
        const response = await this.getPlaylistRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Gets the information necessary to access the playlist and what access the given user has.
     */
    async getPlaylistAccessInfoRaw(params: GetPlaylistAccessInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AccessInfoResponse>> {
        if (params.playlistId === null || params.playlistId === undefined) {
            throw new runtime.RequiredError('playlistId','Required parameter params.playlistId was null or undefined when calling getPlaylistAccessInfo.');
        }

        const queryParameters: any = {};

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists/{playlist_id}/access-info`.replace(`{${"playlist_id"}}`, encodeURIComponent(String(params.playlistId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AccessInfoResponseFromJSON(jsonValue));
    }

    /**
     * Gets the information necessary to access the playlist and what access the given user has.
     */
    async getPlaylistAccessInfo(params: GetPlaylistAccessInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AccessInfoResponse> {
        const response = await this.getPlaylistAccessInfoRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Get a playlist by handle and slug
     */
    async getPlaylistByHandleAndSlugRaw(params: GetPlaylistByHandleAndSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PlaylistResponse>> {
        if (params.handle === null || params.handle === undefined) {
            throw new runtime.RequiredError('handle','Required parameter params.handle was null or undefined when calling getPlaylistByHandleAndSlug.');
        }

        if (params.slug === null || params.slug === undefined) {
            throw new runtime.RequiredError('slug','Required parameter params.slug was null or undefined when calling getPlaylistByHandleAndSlug.');
        }

        const queryParameters: any = {};

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists/by_permalink/{handle}/{slug}`.replace(`{${"handle"}}`, encodeURIComponent(String(params.handle))).replace(`{${"slug"}}`, encodeURIComponent(String(params.slug))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PlaylistResponseFromJSON(jsonValue));
    }

    /**
     * Get a playlist by handle and slug
     */
    async getPlaylistByHandleAndSlug(params: GetPlaylistByHandleAndSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PlaylistResponse> {
        const response = await this.getPlaylistByHandleAndSlugRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Fetch tracks within a playlist.
     */
    async getPlaylistTracksRaw(params: GetPlaylistTracksRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PlaylistTracksResponse>> {
        if (params.playlistId === null || params.playlistId === undefined) {
            throw new runtime.RequiredError('playlistId','Required parameter params.playlistId was null or undefined when calling getPlaylistTracks.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists/{playlist_id}/tracks`.replace(`{${"playlist_id"}}`, encodeURIComponent(String(params.playlistId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PlaylistTracksResponseFromJSON(jsonValue));
    }

    /**
     * Fetch tracks within a playlist.
     */
    async getPlaylistTracks(params: GetPlaylistTracksRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PlaylistTracksResponse> {
        const response = await this.getPlaylistTracksRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Gets trending playlists for a time period
     */
    async getTrendingPlaylistsRaw(params: GetTrendingPlaylistsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TrendingPlaylistsResponse>> {
        const queryParameters: any = {};

        if (params.time !== undefined) {
            queryParameters['time'] = params.time;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists/trending`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TrendingPlaylistsResponseFromJSON(jsonValue));
    }

    /**
     * Gets trending playlists for a time period
     */
    async getTrendingPlaylists(params: GetTrendingPlaylistsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TrendingPlaylistsResponse> {
        const response = await this.getTrendingPlaylistsRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Search for a playlist
     */
    async searchPlaylistsRaw(params: SearchPlaylistsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PlaylistSearchResult>> {
        const queryParameters: any = {};

        if (params.query !== undefined) {
            queryParameters['query'] = params.query;
        }

        if (params.genre) {
            queryParameters['genre'] = params.genre;
        }

        if (params.sortMethod !== undefined) {
            queryParameters['sort_method'] = params.sortMethod;
        }

        if (params.mood) {
            queryParameters['mood'] = params.mood;
        }

        if (params.includePurchaseable !== undefined) {
            queryParameters['includePurchaseable'] = params.includePurchaseable;
        }

        if (params.hasDownloads !== undefined) {
            queryParameters['has_downloads'] = params.hasDownloads;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/playlists/search`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PlaylistSearchResultFromJSON(jsonValue));
    }

    /**
     * Search for a playlist
     */
    async searchPlaylists(params: SearchPlaylistsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PlaylistSearchResult> {
        const response = await this.searchPlaylistsRaw(params, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetTrendingPlaylistsTimeEnum = {
    Week: 'week',
    Month: 'month',
    Year: 'year',
    AllTime: 'allTime'
} as const;
export type GetTrendingPlaylistsTimeEnum = typeof GetTrendingPlaylistsTimeEnum[keyof typeof GetTrendingPlaylistsTimeEnum];
/**
 * @export
 */
export const SearchPlaylistsSortMethodEnum = {
    Relevant: 'relevant',
    Popular: 'popular',
    Recent: 'recent'
} as const;
export type SearchPlaylistsSortMethodEnum = typeof SearchPlaylistsSortMethodEnum[keyof typeof SearchPlaylistsSortMethodEnum];