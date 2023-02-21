# Supporter

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Rank** | **int32** |  | 
**Amount** | **string** |  | 
**Sender** | [**User**](User.md) |  | 

## Methods

### NewSupporter

`func NewSupporter(rank int32, amount string, sender User, ) *Supporter`

NewSupporter instantiates a new Supporter object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewSupporterWithDefaults

`func NewSupporterWithDefaults() *Supporter`

NewSupporterWithDefaults instantiates a new Supporter object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetRank

`func (o *Supporter) GetRank() int32`

GetRank returns the Rank field if non-nil, zero value otherwise.

### GetRankOk

`func (o *Supporter) GetRankOk() (*int32, bool)`

GetRankOk returns a tuple with the Rank field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRank

`func (o *Supporter) SetRank(v int32)`

SetRank sets Rank field to given value.


### GetAmount

`func (o *Supporter) GetAmount() string`

GetAmount returns the Amount field if non-nil, zero value otherwise.

### GetAmountOk

`func (o *Supporter) GetAmountOk() (*string, bool)`

GetAmountOk returns a tuple with the Amount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetAmount

`func (o *Supporter) SetAmount(v string)`

SetAmount sets Amount field to given value.


### GetSender

`func (o *Supporter) GetSender() User`

GetSender returns the Sender field if non-nil, zero value otherwise.

### GetSenderOk

`func (o *Supporter) GetSenderOk() (*User, bool)`

GetSenderOk returns a tuple with the Sender field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSender

`func (o *Supporter) SetSender(v User)`

SetSender sets Sender field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


