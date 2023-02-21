# SubscribersResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Data** | Pointer to [**[]User**](User.md) |  | [optional] 

## Methods

### NewSubscribersResponse

`func NewSubscribersResponse() *SubscribersResponse`

NewSubscribersResponse instantiates a new SubscribersResponse object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewSubscribersResponseWithDefaults

`func NewSubscribersResponseWithDefaults() *SubscribersResponse`

NewSubscribersResponseWithDefaults instantiates a new SubscribersResponse object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetData

`func (o *SubscribersResponse) GetData() []User`

GetData returns the Data field if non-nil, zero value otherwise.

### GetDataOk

`func (o *SubscribersResponse) GetDataOk() (*[]User, bool)`

GetDataOk returns a tuple with the Data field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetData

`func (o *SubscribersResponse) SetData(v []User)`

SetData sets Data field to given value.

### HasData

`func (o *SubscribersResponse) HasData() bool`

HasData returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


