# HistoryResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**LatestChainBlock** | **int32** |  | 
**LatestIndexedBlock** | **int32** |  | 
**LatestChainSlotPlays** | **int32** |  | 
**LatestIndexedSlotPlays** | **int32** |  | 
**Signature** | **string** |  | 
**Timestamp** | **string** |  | 
**Version** | [**VersionMetadata**](VersionMetadata.md) |  | 
**Data** | Pointer to [**[]Activity**](Activity.md) |  | [optional] 

## Methods

### NewHistoryResponse

`func NewHistoryResponse(latestChainBlock int32, latestIndexedBlock int32, latestChainSlotPlays int32, latestIndexedSlotPlays int32, signature string, timestamp string, version VersionMetadata, ) *HistoryResponse`

NewHistoryResponse instantiates a new HistoryResponse object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewHistoryResponseWithDefaults

`func NewHistoryResponseWithDefaults() *HistoryResponse`

NewHistoryResponseWithDefaults instantiates a new HistoryResponse object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetLatestChainBlock

`func (o *HistoryResponse) GetLatestChainBlock() int32`

GetLatestChainBlock returns the LatestChainBlock field if non-nil, zero value otherwise.

### GetLatestChainBlockOk

`func (o *HistoryResponse) GetLatestChainBlockOk() (*int32, bool)`

GetLatestChainBlockOk returns a tuple with the LatestChainBlock field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetLatestChainBlock

`func (o *HistoryResponse) SetLatestChainBlock(v int32)`

SetLatestChainBlock sets LatestChainBlock field to given value.


### GetLatestIndexedBlock

`func (o *HistoryResponse) GetLatestIndexedBlock() int32`

GetLatestIndexedBlock returns the LatestIndexedBlock field if non-nil, zero value otherwise.

### GetLatestIndexedBlockOk

`func (o *HistoryResponse) GetLatestIndexedBlockOk() (*int32, bool)`

GetLatestIndexedBlockOk returns a tuple with the LatestIndexedBlock field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetLatestIndexedBlock

`func (o *HistoryResponse) SetLatestIndexedBlock(v int32)`

SetLatestIndexedBlock sets LatestIndexedBlock field to given value.


### GetLatestChainSlotPlays

`func (o *HistoryResponse) GetLatestChainSlotPlays() int32`

GetLatestChainSlotPlays returns the LatestChainSlotPlays field if non-nil, zero value otherwise.

### GetLatestChainSlotPlaysOk

`func (o *HistoryResponse) GetLatestChainSlotPlaysOk() (*int32, bool)`

GetLatestChainSlotPlaysOk returns a tuple with the LatestChainSlotPlays field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetLatestChainSlotPlays

`func (o *HistoryResponse) SetLatestChainSlotPlays(v int32)`

SetLatestChainSlotPlays sets LatestChainSlotPlays field to given value.


### GetLatestIndexedSlotPlays

`func (o *HistoryResponse) GetLatestIndexedSlotPlays() int32`

GetLatestIndexedSlotPlays returns the LatestIndexedSlotPlays field if non-nil, zero value otherwise.

### GetLatestIndexedSlotPlaysOk

`func (o *HistoryResponse) GetLatestIndexedSlotPlaysOk() (*int32, bool)`

GetLatestIndexedSlotPlaysOk returns a tuple with the LatestIndexedSlotPlays field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetLatestIndexedSlotPlays

`func (o *HistoryResponse) SetLatestIndexedSlotPlays(v int32)`

SetLatestIndexedSlotPlays sets LatestIndexedSlotPlays field to given value.


### GetSignature

`func (o *HistoryResponse) GetSignature() string`

GetSignature returns the Signature field if non-nil, zero value otherwise.

### GetSignatureOk

`func (o *HistoryResponse) GetSignatureOk() (*string, bool)`

GetSignatureOk returns a tuple with the Signature field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSignature

`func (o *HistoryResponse) SetSignature(v string)`

SetSignature sets Signature field to given value.


### GetTimestamp

`func (o *HistoryResponse) GetTimestamp() string`

GetTimestamp returns the Timestamp field if non-nil, zero value otherwise.

### GetTimestampOk

`func (o *HistoryResponse) GetTimestampOk() (*string, bool)`

GetTimestampOk returns a tuple with the Timestamp field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTimestamp

`func (o *HistoryResponse) SetTimestamp(v string)`

SetTimestamp sets Timestamp field to given value.


### GetVersion

`func (o *HistoryResponse) GetVersion() VersionMetadata`

GetVersion returns the Version field if non-nil, zero value otherwise.

### GetVersionOk

`func (o *HistoryResponse) GetVersionOk() (*VersionMetadata, bool)`

GetVersionOk returns a tuple with the Version field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetVersion

`func (o *HistoryResponse) SetVersion(v VersionMetadata)`

SetVersion sets Version field to given value.


### GetData

`func (o *HistoryResponse) GetData() []Activity`

GetData returns the Data field if non-nil, zero value otherwise.

### GetDataOk

`func (o *HistoryResponse) GetDataOk() (*[]Activity, bool)`

GetDataOk returns a tuple with the Data field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetData

`func (o *HistoryResponse) SetData(v []Activity)`

SetData sets Data field to given value.

### HasData

`func (o *HistoryResponse) HasData() bool`

HasData returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


