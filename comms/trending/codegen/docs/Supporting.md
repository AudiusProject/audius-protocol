# Supporting

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Rank** | **int32** |  | 
**Amount** | **string** |  | 
**Receiver** | [**User**](User.md) |  | 

## Methods

### NewSupporting

`func NewSupporting(rank int32, amount string, receiver User, ) *Supporting`

NewSupporting instantiates a new Supporting object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewSupportingWithDefaults

`func NewSupportingWithDefaults() *Supporting`

NewSupportingWithDefaults instantiates a new Supporting object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetRank

`func (o *Supporting) GetRank() int32`

GetRank returns the Rank field if non-nil, zero value otherwise.

### GetRankOk

`func (o *Supporting) GetRankOk() (*int32, bool)`

GetRankOk returns a tuple with the Rank field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRank

`func (o *Supporting) SetRank(v int32)`

SetRank sets Rank field to given value.


### GetAmount

`func (o *Supporting) GetAmount() string`

GetAmount returns the Amount field if non-nil, zero value otherwise.

### GetAmountOk

`func (o *Supporting) GetAmountOk() (*string, bool)`

GetAmountOk returns a tuple with the Amount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetAmount

`func (o *Supporting) SetAmount(v string)`

SetAmount sets Amount field to given value.


### GetReceiver

`func (o *Supporting) GetReceiver() User`

GetReceiver returns the Receiver field if non-nil, zero value otherwise.

### GetReceiverOk

`func (o *Supporting) GetReceiverOk() (*User, bool)`

GetReceiverOk returns a tuple with the Receiver field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetReceiver

`func (o *Supporting) SetReceiver(v User)`

SetReceiver sets Receiver field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


