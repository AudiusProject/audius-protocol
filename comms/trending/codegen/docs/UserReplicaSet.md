# UserReplicaSet

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**UserId** | **int32** |  | 
**Wallet** | **string** |  | 
**Primary** | Pointer to **string** |  | [optional] 
**Secondary1** | Pointer to **string** |  | [optional] 
**Secondary2** | Pointer to **string** |  | [optional] 
**PrimarySpID** | Pointer to **int32** |  | [optional] 
**Secondary1SpID** | Pointer to **int32** |  | [optional] 
**Secondary2SpID** | Pointer to **int32** |  | [optional] 

## Methods

### NewUserReplicaSet

`func NewUserReplicaSet(userId int32, wallet string, ) *UserReplicaSet`

NewUserReplicaSet instantiates a new UserReplicaSet object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewUserReplicaSetWithDefaults

`func NewUserReplicaSetWithDefaults() *UserReplicaSet`

NewUserReplicaSetWithDefaults instantiates a new UserReplicaSet object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetUserId

`func (o *UserReplicaSet) GetUserId() int32`

GetUserId returns the UserId field if non-nil, zero value otherwise.

### GetUserIdOk

`func (o *UserReplicaSet) GetUserIdOk() (*int32, bool)`

GetUserIdOk returns a tuple with the UserId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetUserId

`func (o *UserReplicaSet) SetUserId(v int32)`

SetUserId sets UserId field to given value.


### GetWallet

`func (o *UserReplicaSet) GetWallet() string`

GetWallet returns the Wallet field if non-nil, zero value otherwise.

### GetWalletOk

`func (o *UserReplicaSet) GetWalletOk() (*string, bool)`

GetWalletOk returns a tuple with the Wallet field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetWallet

`func (o *UserReplicaSet) SetWallet(v string)`

SetWallet sets Wallet field to given value.


### GetPrimary

`func (o *UserReplicaSet) GetPrimary() string`

GetPrimary returns the Primary field if non-nil, zero value otherwise.

### GetPrimaryOk

`func (o *UserReplicaSet) GetPrimaryOk() (*string, bool)`

GetPrimaryOk returns a tuple with the Primary field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPrimary

`func (o *UserReplicaSet) SetPrimary(v string)`

SetPrimary sets Primary field to given value.

### HasPrimary

`func (o *UserReplicaSet) HasPrimary() bool`

HasPrimary returns a boolean if a field has been set.

### GetSecondary1

`func (o *UserReplicaSet) GetSecondary1() string`

GetSecondary1 returns the Secondary1 field if non-nil, zero value otherwise.

### GetSecondary1Ok

`func (o *UserReplicaSet) GetSecondary1Ok() (*string, bool)`

GetSecondary1Ok returns a tuple with the Secondary1 field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSecondary1

`func (o *UserReplicaSet) SetSecondary1(v string)`

SetSecondary1 sets Secondary1 field to given value.

### HasSecondary1

`func (o *UserReplicaSet) HasSecondary1() bool`

HasSecondary1 returns a boolean if a field has been set.

### GetSecondary2

`func (o *UserReplicaSet) GetSecondary2() string`

GetSecondary2 returns the Secondary2 field if non-nil, zero value otherwise.

### GetSecondary2Ok

`func (o *UserReplicaSet) GetSecondary2Ok() (*string, bool)`

GetSecondary2Ok returns a tuple with the Secondary2 field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSecondary2

`func (o *UserReplicaSet) SetSecondary2(v string)`

SetSecondary2 sets Secondary2 field to given value.

### HasSecondary2

`func (o *UserReplicaSet) HasSecondary2() bool`

HasSecondary2 returns a boolean if a field has been set.

### GetPrimarySpID

`func (o *UserReplicaSet) GetPrimarySpID() int32`

GetPrimarySpID returns the PrimarySpID field if non-nil, zero value otherwise.

### GetPrimarySpIDOk

`func (o *UserReplicaSet) GetPrimarySpIDOk() (*int32, bool)`

GetPrimarySpIDOk returns a tuple with the PrimarySpID field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPrimarySpID

`func (o *UserReplicaSet) SetPrimarySpID(v int32)`

SetPrimarySpID sets PrimarySpID field to given value.

### HasPrimarySpID

`func (o *UserReplicaSet) HasPrimarySpID() bool`

HasPrimarySpID returns a boolean if a field has been set.

### GetSecondary1SpID

`func (o *UserReplicaSet) GetSecondary1SpID() int32`

GetSecondary1SpID returns the Secondary1SpID field if non-nil, zero value otherwise.

### GetSecondary1SpIDOk

`func (o *UserReplicaSet) GetSecondary1SpIDOk() (*int32, bool)`

GetSecondary1SpIDOk returns a tuple with the Secondary1SpID field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSecondary1SpID

`func (o *UserReplicaSet) SetSecondary1SpID(v int32)`

SetSecondary1SpID sets Secondary1SpID field to given value.

### HasSecondary1SpID

`func (o *UserReplicaSet) HasSecondary1SpID() bool`

HasSecondary1SpID returns a boolean if a field has been set.

### GetSecondary2SpID

`func (o *UserReplicaSet) GetSecondary2SpID() int32`

GetSecondary2SpID returns the Secondary2SpID field if non-nil, zero value otherwise.

### GetSecondary2SpIDOk

`func (o *UserReplicaSet) GetSecondary2SpIDOk() (*int32, bool)`

GetSecondary2SpIDOk returns a tuple with the Secondary2SpID field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSecondary2SpID

`func (o *UserReplicaSet) SetSecondary2SpID(v int32)`

SetSecondary2SpID sets Secondary2SpID field to given value.

### HasSecondary2SpID

`func (o *UserReplicaSet) HasSecondary2SpID() bool`

HasSecondary2SpID returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


