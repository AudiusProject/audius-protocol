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
  EventsResponse,
  UnclaimedIdResponse,
} from '../models';
import {
    EventsResponseFromJSON,
    EventsResponseToJSON,
    UnclaimedIdResponseFromJSON,
    UnclaimedIdResponseToJSON,
} from '../models';

export interface GetAllEventsRequest {
    offset?: number;
    limit?: number;
    userId?: string;
    sortMethod?: GetAllEventsSortMethodEnum;
    eventType?: GetAllEventsEventTypeEnum;
}

export interface GetBulkEventsRequest {
    userId?: string;
    id?: Array<string>;
    eventType?: GetBulkEventsEventTypeEnum;
}

export interface GetEntityEventsRequest {
    entityId: Array<string>;
    offset?: number;
    limit?: number;
    userId?: string;
    entityType?: GetEntityEventsEntityTypeEnum;
    filterDeleted?: boolean;
}

/**
 * 
 */
export class EventsApi extends runtime.BaseAPI {

    /**
     * @hidden
     * Get all events
     * Get all events
     */
    async getAllEventsRaw(params: GetAllEventsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EventsResponse>> {
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

        if (params.sortMethod !== undefined) {
            queryParameters['sort_method'] = params.sortMethod;
        }

        if (params.eventType !== undefined) {
            queryParameters['event_type'] = params.eventType;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/events/all`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => EventsResponseFromJSON(jsonValue));
    }

    /**
     * Get all events
     * Get all events
     */
    async getAllEvents(params: GetAllEventsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EventsResponse> {
        const response = await this.getAllEventsRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Get a list of events by ID
     */
    async getBulkEventsRaw(params: GetBulkEventsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EventsResponse>> {
        const queryParameters: any = {};

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        if (params.id) {
            queryParameters['id'] = params.id;
        }

        if (params.eventType !== undefined) {
            queryParameters['event_type'] = params.eventType;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/events`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => EventsResponseFromJSON(jsonValue));
    }

    /**
     * Get a list of events by ID
     */
    async getBulkEvents(params: GetBulkEventsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EventsResponse> {
        const response = await this.getBulkEventsRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Get events for a specific entity
     * Get events for a specific entity
     */
    async getEntityEventsRaw(params: GetEntityEventsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EventsResponse>> {
        if (params.entityId === null || params.entityId === undefined) {
            throw new runtime.RequiredError('entityId','Required parameter params.entityId was null or undefined when calling getEntityEvents.');
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

        if (params.entityId) {
            queryParameters['entity_id'] = params.entityId;
        }

        if (params.entityType !== undefined) {
            queryParameters['entity_type'] = params.entityType;
        }

        if (params.filterDeleted !== undefined) {
            queryParameters['filter_deleted'] = params.filterDeleted;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/events/entity`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => EventsResponseFromJSON(jsonValue));
    }

    /**
     * Get events for a specific entity
     * Get events for a specific entity
     */
    async getEntityEvents(params: GetEntityEventsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EventsResponse> {
        const response = await this.getEntityEventsRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * Gets an unclaimed blockchain event ID
     */
    async getUnclaimedEventIDRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UnclaimedIdResponse>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/events/unclaimed_id`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UnclaimedIdResponseFromJSON(jsonValue));
    }

    /**
     * Gets an unclaimed blockchain event ID
     */
    async getUnclaimedEventID(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UnclaimedIdResponse> {
        const response = await this.getUnclaimedEventIDRaw(initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetAllEventsSortMethodEnum = {
    Newest: 'newest',
    Timestamp: 'timestamp'
} as const;
export type GetAllEventsSortMethodEnum = typeof GetAllEventsSortMethodEnum[keyof typeof GetAllEventsSortMethodEnum];
/**
 * @export
 */
export const GetAllEventsEventTypeEnum = {
    RemixContest: 'remix_contest',
    LiveEvent: 'live_event',
    NewRelease: 'new_release'
} as const;
export type GetAllEventsEventTypeEnum = typeof GetAllEventsEventTypeEnum[keyof typeof GetAllEventsEventTypeEnum];
/**
 * @export
 */
export const GetBulkEventsEventTypeEnum = {
    RemixContest: 'remix_contest',
    LiveEvent: 'live_event',
    NewRelease: 'new_release'
} as const;
export type GetBulkEventsEventTypeEnum = typeof GetBulkEventsEventTypeEnum[keyof typeof GetBulkEventsEventTypeEnum];
/**
 * @export
 */
export const GetEntityEventsEntityTypeEnum = {
    Track: 'track',
    Collection: 'collection',
    User: 'user'
} as const;
export type GetEntityEventsEntityTypeEnum = typeof GetEntityEventsEntityTypeEnum[keyof typeof GetEntityEventsEntityTypeEnum];
