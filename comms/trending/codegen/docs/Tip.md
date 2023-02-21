# Tip

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Amount** | **string** |  | 
**Sender** | Pointer to [**User**](User.md) |  | [optional] 
**Receiver** | Pointer to [**User**](User.md) |  | [optional] 
**CreatedAt** | **string** |  | 

## Methods

### NewTip

`func NewTip(amount string, createdAt string, ) *Tip`

NewTip instantiates a new Tip object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewTipWithDefaults

`func NewTipWithDefaults() *Tip`

NewTipWithDefaults instantiates a new Tip object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetAmount

`func (o *Tip) GetAmount() string`

GetAmount returns the Amount field if non-nil, zero value otherwise.

### GetAmountOk

`func (o *Tip) GetAmountOk() (*string, bool)`

GetAmountOk returns a tuple with the Amount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetAmount

`func (o *Tip) SetAmount(v string)`

SetAmount sets Amount field to given value.


### GetSender

`func (o *Tip) GetSender() User`

GetSender returns the Sender field if non-nil, zero value otherwise.

### GetSenderOk

`func (o *Tip) GetSenderOk() (*User, bool)`

GetSenderOk returns a tuple with the Sender field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSender

`func (o *Tip) SetSender(v User)`

SetSender sets Sender field to given value.

### HasSender

`func (o *Tip) HasSender() bool`

HasSender returns a boolean if a field has been set.

### GetReceiver

`func (o *Tip) GetReceiver() User`

GetReceiver returns the Receiver field if non-nil, zero value otherwise.

### GetReceiverOk

`func (o *Tip) GetReceiverOk() (*User, bool)`

GetReceiverOk returns a tuple with the Receiver field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetReceiver

`func (o *Tip) SetReceiver(v User)`

SetReceiver sets Receiver field to given value.

### HasReceiver

`func (o *Tip) HasReceiver() bool`

HasReceiver returns a boolean if a field has been set.

### GetCreatedAt

`func (o *Tip) GetCreatedAt() string`

GetCreatedAt returns the CreatedAt field if non-nil, zero value otherwise.

### GetCreatedAtOk

`func (o *Tip) GetCreatedAtOk() (*string, bool)`

GetCreatedAtOk returns a tuple with the CreatedAt field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetCreatedAt

`func (o *Tip) SetCreatedAt(v string)`

SetCreatedAt sets CreatedAt field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


