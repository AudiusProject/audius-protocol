---
id: "DiscoveryNodeSelector"
title: "DiscoveryNodeSelector"
sidebar_position: 0
custom_edit_url: null
---

## Implements

- [`DiscoveryNodeSelectorService`](../modules.md#discoverynodeselectorservice)

## Accessors

### isBehind

`get` **isBehind**(): `boolean`

#### Returns

`boolean`

`set` **isBehind**(`isBehind`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `isBehind` | `boolean` |

#### Returns

`void`

## Methods

### anyHealthyEndpoint

`Private` **anyHealthyEndpoint**(`endpoints`): `Promise`<``null`` \| `string`\>

Checks to see if any of the endpoints are healthy, returning the first one that is.
Cancels the remaining promises.
Uses the configured timeout.
Any unhealthy or behind services found are placed into the unhealthy and backup lists respectively

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `endpoints` | `string`[] | the endpoints to race |

#### Returns

`Promise`<``null`` \| `string`\>

the fastest healthy endpoint or null if none are healthy

___

### createMiddleware

**createMiddleware**(): [`Middleware`](../interfaces/Middleware.md)

Returns a middleware that reselects if the current discovery node is behind

#### Returns

[`Middleware`](../interfaces/Middleware.md)

the middleware

#### Implementation of

DiscoveryNodeSelectorService.createMiddleware

___

### getSelectedEndpoint

**getSelectedEndpoint**(): `Promise`<``null`` \| `string`\>

Selects a discovery node or returns the existing selection

#### Returns

`Promise`<``null`` \| `string`\>

a discovery node endpoint

#### Implementation of

DiscoveryNodeSelectorService.getSelectedEndpoint

___

### getServices

**getServices**(): `string`[]

Gets the list of services

#### Returns

`string`[]

___

### reselectAndRetry

`Private` **reselectAndRetry**(`__namedParameters`): `Promise`<`undefined` \| `Response`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.context` | [`ResponseContext`](../interfaces/ResponseContext.md) \| [`ErrorContext`](../interfaces/ErrorContext.md) |
| `__namedParameters.endpoint` | `string` |

#### Returns

`Promise`<`undefined` \| `Response`\>

___

### reselectIfNecessary

`Private` **reselectIfNecessary**(`endpoint`): `Promise`<``null`` \| `string`\>

Checks the given endpoint's health check and reselects if necessary.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `endpoint` | `Object` | the endpoint to health_check |
| `endpoint.data` | [`BackupHealthData`](../modules.md#backuphealthdata) | - |
| `endpoint.endpoint` | `string` | - |
| `endpoint.health` | `HealthCheckStatus` | - |
| `endpoint.reason?` | `string` | - |

#### Returns

`Promise`<``null`` \| `string`\>

a new discovery node if reselect was necessary, or the existing endpoint if reselect unnecessary

___

### select

`Private` **select**(`prevSelectedNode`): `Promise`<``null`` \| `string`\>

Finds a healthy discovery node

#### Parameters

| Name | Type |
| :------ | :------ |
| `prevSelectedNode` | ``null`` \| `string` |

#### Returns

`Promise`<``null`` \| `string`\>

a healthy discovery node endpoint

___

### selectFromBackups

`Private` **selectFromBackups**(): `Promise`<``null`` \| `string`\>

First try to get a node that's got a healthy blockdiff, but a behind version.
If that fails, get the node with the lowest blockdiff on the most up to date version

#### Returns

`Promise`<``null`` \| `string`\>

___

### triggerCleanup

`Private` **triggerCleanup**(): `void`

Sets (or resets) a setTimeout to reset the backup and unhealthy service lists

#### Returns

`void`

___

### updateConfig

**updateConfig**(`config`): `void`

Updates the config.
Note that setting the initial node or bootstrap nodes here does nothing as the service is already initialized.
Will force reselections if health check thresholds change (as that might cause the current node to be considered unhealthy)
or if the selected node is excluded per allow/blocklists

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | `Object` | - |
| `config.allowlist?` | ``null`` \| `Set`<`string`\> | Only services from this list are allowed to be picked |
| `config.backupsTTL?` | `number` | - |
| `config.blocklist?` | ``null`` \| `Set`<`string`\> | Services from this list should not be picked |
| `config.bootstrapServices?` | `string`[] | This should be a list of registered discovery nodes that can be used to initialize the selection and get the current registered list from.  **`example`** ['https://discoverynode.audius.co', 'https://disoverynode2.audius.co'] |
| `config.healthCheckThresholds?` | { minVersion?: string \| null \| undefined; maxSlotDiffPlays?: number \| null \| undefined; maxBlockDiff?: number \| undefined; } | Configuration for determining healthy status |
| `config.initialSelectedNode?` | ``null`` \| `string` | Starts the service with a preset selection. Useful for caching/eager loading |
| `config.logger?` | { createPrefixedLogger?: {} \| undefined; debug?: {} \| undefined; info?: {} \| undefined; warn?: {} \| undefined; error?: {} \| undefined; } | - |
| `config.maxConcurrentRequests?` | `number` | - |
| `config.requestTimeout?` | `number` | the timeout at which to give up on a service healthcheck |
| `config.unhealthyTTL?` | `number` | - |

#### Returns

`void`
