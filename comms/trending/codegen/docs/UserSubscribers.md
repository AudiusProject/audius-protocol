# UserSubscribers

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**UserId** | **string** |  | 
**SubscriberIds** | Pointer to **[]string** |  | [optional] 

## Methods

### NewUserSubscribers

`func NewUserSubscribers(userId string, ) *UserSubscribers`

NewUserSubscribers instantiates a new UserSubscribers object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewUserSubscribersWithDefaults

`func NewUserSubscribersWithDefaults() *UserSubscribers`

NewUserSubscribersWithDefaults instantiates a new UserSubscribers object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetUserId

`func (o *UserSubscribers) GetUserId() string`

GetUserId returns the UserId field if non-nil, zero value otherwise.

### GetUserIdOk

`func (o *UserSubscribers) GetUserIdOk() (*string, bool)`

GetUserIdOk returns a tuple with the UserId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetUserId

`func (o *UserSubscribers) SetUserId(v string)`

SetUserId sets UserId field to given value.


### GetSubscriberIds

`func (o *UserSubscribers) GetSubscriberIds() []string`

GetSubscriberIds returns the SubscriberIds field if non-nil, zero value otherwise.

### GetSubscriberIdsOk

`func (o *UserSubscribers) GetSubscriberIdsOk() (*[]string, bool)`

GetSubscriberIdsOk returns a tuple with the SubscriberIds field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSubscriberIds

`func (o *UserSubscribers) SetSubscriberIds(v []string)`

SetSubscriberIds sets SubscriberIds field to given value.

### HasSubscriberIds

`func (o *UserSubscribers) HasSubscriberIds() bool`

HasSubscriberIds returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


