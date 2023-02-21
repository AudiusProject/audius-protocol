# DecodedUserToken

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**UserId** | **string** |  | 
**Email** | **string** |  | 
**Name** | **string** |  | 
**Handle** | **string** |  | 
**Verified** | **bool** |  | 
**ProfilePicture** | Pointer to [**ProfilePicture**](ProfilePicture.md) |  | [optional] 
**Sub** | **string** |  | 
**Iat** | **string** |  | 

## Methods

### NewDecodedUserToken

`func NewDecodedUserToken(userId string, email string, name string, handle string, verified bool, sub string, iat string, ) *DecodedUserToken`

NewDecodedUserToken instantiates a new DecodedUserToken object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewDecodedUserTokenWithDefaults

`func NewDecodedUserTokenWithDefaults() *DecodedUserToken`

NewDecodedUserTokenWithDefaults instantiates a new DecodedUserToken object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetUserId

`func (o *DecodedUserToken) GetUserId() string`

GetUserId returns the UserId field if non-nil, zero value otherwise.

### GetUserIdOk

`func (o *DecodedUserToken) GetUserIdOk() (*string, bool)`

GetUserIdOk returns a tuple with the UserId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetUserId

`func (o *DecodedUserToken) SetUserId(v string)`

SetUserId sets UserId field to given value.


### GetEmail

`func (o *DecodedUserToken) GetEmail() string`

GetEmail returns the Email field if non-nil, zero value otherwise.

### GetEmailOk

`func (o *DecodedUserToken) GetEmailOk() (*string, bool)`

GetEmailOk returns a tuple with the Email field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetEmail

`func (o *DecodedUserToken) SetEmail(v string)`

SetEmail sets Email field to given value.


### GetName

`func (o *DecodedUserToken) GetName() string`

GetName returns the Name field if non-nil, zero value otherwise.

### GetNameOk

`func (o *DecodedUserToken) GetNameOk() (*string, bool)`

GetNameOk returns a tuple with the Name field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetName

`func (o *DecodedUserToken) SetName(v string)`

SetName sets Name field to given value.


### GetHandle

`func (o *DecodedUserToken) GetHandle() string`

GetHandle returns the Handle field if non-nil, zero value otherwise.

### GetHandleOk

`func (o *DecodedUserToken) GetHandleOk() (*string, bool)`

GetHandleOk returns a tuple with the Handle field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetHandle

`func (o *DecodedUserToken) SetHandle(v string)`

SetHandle sets Handle field to given value.


### GetVerified

`func (o *DecodedUserToken) GetVerified() bool`

GetVerified returns the Verified field if non-nil, zero value otherwise.

### GetVerifiedOk

`func (o *DecodedUserToken) GetVerifiedOk() (*bool, bool)`

GetVerifiedOk returns a tuple with the Verified field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetVerified

`func (o *DecodedUserToken) SetVerified(v bool)`

SetVerified sets Verified field to given value.


### GetProfilePicture

`func (o *DecodedUserToken) GetProfilePicture() ProfilePicture`

GetProfilePicture returns the ProfilePicture field if non-nil, zero value otherwise.

### GetProfilePictureOk

`func (o *DecodedUserToken) GetProfilePictureOk() (*ProfilePicture, bool)`

GetProfilePictureOk returns a tuple with the ProfilePicture field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetProfilePicture

`func (o *DecodedUserToken) SetProfilePicture(v ProfilePicture)`

SetProfilePicture sets ProfilePicture field to given value.

### HasProfilePicture

`func (o *DecodedUserToken) HasProfilePicture() bool`

HasProfilePicture returns a boolean if a field has been set.

### GetSub

`func (o *DecodedUserToken) GetSub() string`

GetSub returns the Sub field if non-nil, zero value otherwise.

### GetSubOk

`func (o *DecodedUserToken) GetSubOk() (*string, bool)`

GetSubOk returns a tuple with the Sub field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSub

`func (o *DecodedUserToken) SetSub(v string)`

SetSub sets Sub field to given value.


### GetIat

`func (o *DecodedUserToken) GetIat() string`

GetIat returns the Iat field if non-nil, zero value otherwise.

### GetIatOk

`func (o *DecodedUserToken) GetIatOk() (*string, bool)`

GetIatOk returns a tuple with the Iat field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetIat

`func (o *DecodedUserToken) SetIat(v string)`

SetIat sets Iat field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


