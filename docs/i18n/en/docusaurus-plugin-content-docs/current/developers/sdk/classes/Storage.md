---
id: "Storage"
title: "Storage"
sidebar_position: 0
custom_edit_url: null
---

## Implements

- [`StorageService`](../modules.md#storageservice)

## Methods

### editFile

**editFile**(`__namedParameters`): `Promise`<`UploadResponse`\>

Upload a file on content nodes

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.auth` | [`AuthService`](../modules.md#authservice) |
| `__namedParameters.data` | `Object` |
| `__namedParameters.uploadId` | `string` |

#### Returns

`Promise`<`UploadResponse`\>

#### Implementation of

StorageService.editFile

___

### getProcessingStatus

`Private` **getProcessingStatus**(`id`): `Promise`<`UploadResponse`\>

Gets the task progress given the task type and id associated with the job

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | the id of the transcoding or resizing job |

#### Returns

`Promise`<`UploadResponse`\>

the status, and the success or failed response if the job is complete

___

### pollProcessingStatus

`Private` **pollProcessingStatus**(`id`, `maxPollingMs`): `Promise`<`UploadResponse`\>

Works for both track transcode and image resize jobs

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | ID of the transcode/resize job |
| `maxPollingMs` | `number` | millis to stop polling and error if job is not done |

#### Returns

`Promise`<`UploadResponse`\>

successful job info, or throws error if job fails / times out

___

### uploadFile

**uploadFile**(`__namedParameters`): `Promise`<`UploadResponse`\>

Upload a file to a content node

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.file` | { `buffer`: `Buffer` ; `name`: `undefined` \| `string`  } \| `File` |
| `__namedParameters.onProgress?` | `ProgressCB` |
| `__namedParameters.options?` | `Object` |
| `__namedParameters.template` | `FileTemplate` |

#### Returns

`Promise`<`UploadResponse`\>

#### Implementation of

StorageService.uploadFile
