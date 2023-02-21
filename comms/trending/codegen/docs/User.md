# User

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**AlbumCount** | **int32** |  | 
**ArtistPickTrackId** | Pointer to **string** |  | [optional] 
**Bio** | Pointer to **string** |  | [optional] 
**CoverPhoto** | Pointer to [**CoverPhoto**](CoverPhoto.md) |  | [optional] 
**FolloweeCount** | **int32** |  | 
**FollowerCount** | **int32** |  | 
**DoesFollowCurrentUser** | Pointer to **bool** |  | [optional] 
**Handle** | **string** |  | 
**Id** | **string** |  | 
**IsVerified** | **bool** |  | 
**Location** | Pointer to **string** |  | [optional] 
**Name** | **string** |  | 
**PlaylistCount** | **int32** |  | 
**ProfilePicture** | Pointer to [**ProfilePicture**](ProfilePicture.md) |  | [optional] 
**RepostCount** | **int32** |  | 
**TrackCount** | **int32** |  | 
**IsDeactivated** | **bool** |  | 
**ErcWallet** | Pointer to **string** |  | [optional] 
**SplWallet** | **string** |  | 
**SupporterCount** | **int32** |  | 
**SupportingCount** | **int32** |  | 

## Methods

### NewUser

`func NewUser(albumCount int32, followeeCount int32, followerCount int32, handle string, id string, isVerified bool, name string, playlistCount int32, repostCount int32, trackCount int32, isDeactivated bool, splWallet string, supporterCount int32, supportingCount int32, ) *User`

NewUser instantiates a new User object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewUserWithDefaults

`func NewUserWithDefaults() *User`

NewUserWithDefaults instantiates a new User object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetAlbumCount

`func (o *User) GetAlbumCount() int32`

GetAlbumCount returns the AlbumCount field if non-nil, zero value otherwise.

### GetAlbumCountOk

`func (o *User) GetAlbumCountOk() (*int32, bool)`

GetAlbumCountOk returns a tuple with the AlbumCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetAlbumCount

`func (o *User) SetAlbumCount(v int32)`

SetAlbumCount sets AlbumCount field to given value.


### GetArtistPickTrackId

`func (o *User) GetArtistPickTrackId() string`

GetArtistPickTrackId returns the ArtistPickTrackId field if non-nil, zero value otherwise.

### GetArtistPickTrackIdOk

`func (o *User) GetArtistPickTrackIdOk() (*string, bool)`

GetArtistPickTrackIdOk returns a tuple with the ArtistPickTrackId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetArtistPickTrackId

`func (o *User) SetArtistPickTrackId(v string)`

SetArtistPickTrackId sets ArtistPickTrackId field to given value.

### HasArtistPickTrackId

`func (o *User) HasArtistPickTrackId() bool`

HasArtistPickTrackId returns a boolean if a field has been set.

### GetBio

`func (o *User) GetBio() string`

GetBio returns the Bio field if non-nil, zero value otherwise.

### GetBioOk

`func (o *User) GetBioOk() (*string, bool)`

GetBioOk returns a tuple with the Bio field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetBio

`func (o *User) SetBio(v string)`

SetBio sets Bio field to given value.

### HasBio

`func (o *User) HasBio() bool`

HasBio returns a boolean if a field has been set.

### GetCoverPhoto

`func (o *User) GetCoverPhoto() CoverPhoto`

GetCoverPhoto returns the CoverPhoto field if non-nil, zero value otherwise.

### GetCoverPhotoOk

`func (o *User) GetCoverPhotoOk() (*CoverPhoto, bool)`

GetCoverPhotoOk returns a tuple with the CoverPhoto field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetCoverPhoto

`func (o *User) SetCoverPhoto(v CoverPhoto)`

SetCoverPhoto sets CoverPhoto field to given value.

### HasCoverPhoto

`func (o *User) HasCoverPhoto() bool`

HasCoverPhoto returns a boolean if a field has been set.

### GetFolloweeCount

`func (o *User) GetFolloweeCount() int32`

GetFolloweeCount returns the FolloweeCount field if non-nil, zero value otherwise.

### GetFolloweeCountOk

`func (o *User) GetFolloweeCountOk() (*int32, bool)`

GetFolloweeCountOk returns a tuple with the FolloweeCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetFolloweeCount

`func (o *User) SetFolloweeCount(v int32)`

SetFolloweeCount sets FolloweeCount field to given value.


### GetFollowerCount

`func (o *User) GetFollowerCount() int32`

GetFollowerCount returns the FollowerCount field if non-nil, zero value otherwise.

### GetFollowerCountOk

`func (o *User) GetFollowerCountOk() (*int32, bool)`

GetFollowerCountOk returns a tuple with the FollowerCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetFollowerCount

`func (o *User) SetFollowerCount(v int32)`

SetFollowerCount sets FollowerCount field to given value.


### GetDoesFollowCurrentUser

`func (o *User) GetDoesFollowCurrentUser() bool`

GetDoesFollowCurrentUser returns the DoesFollowCurrentUser field if non-nil, zero value otherwise.

### GetDoesFollowCurrentUserOk

`func (o *User) GetDoesFollowCurrentUserOk() (*bool, bool)`

GetDoesFollowCurrentUserOk returns a tuple with the DoesFollowCurrentUser field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDoesFollowCurrentUser

`func (o *User) SetDoesFollowCurrentUser(v bool)`

SetDoesFollowCurrentUser sets DoesFollowCurrentUser field to given value.

### HasDoesFollowCurrentUser

`func (o *User) HasDoesFollowCurrentUser() bool`

HasDoesFollowCurrentUser returns a boolean if a field has been set.

### GetHandle

`func (o *User) GetHandle() string`

GetHandle returns the Handle field if non-nil, zero value otherwise.

### GetHandleOk

`func (o *User) GetHandleOk() (*string, bool)`

GetHandleOk returns a tuple with the Handle field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetHandle

`func (o *User) SetHandle(v string)`

SetHandle sets Handle field to given value.


### GetId

`func (o *User) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *User) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *User) SetId(v string)`

SetId sets Id field to given value.


### GetIsVerified

`func (o *User) GetIsVerified() bool`

GetIsVerified returns the IsVerified field if non-nil, zero value otherwise.

### GetIsVerifiedOk

`func (o *User) GetIsVerifiedOk() (*bool, bool)`

GetIsVerifiedOk returns a tuple with the IsVerified field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetIsVerified

`func (o *User) SetIsVerified(v bool)`

SetIsVerified sets IsVerified field to given value.


### GetLocation

`func (o *User) GetLocation() string`

GetLocation returns the Location field if non-nil, zero value otherwise.

### GetLocationOk

`func (o *User) GetLocationOk() (*string, bool)`

GetLocationOk returns a tuple with the Location field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetLocation

`func (o *User) SetLocation(v string)`

SetLocation sets Location field to given value.

### HasLocation

`func (o *User) HasLocation() bool`

HasLocation returns a boolean if a field has been set.

### GetName

`func (o *User) GetName() string`

GetName returns the Name field if non-nil, zero value otherwise.

### GetNameOk

`func (o *User) GetNameOk() (*string, bool)`

GetNameOk returns a tuple with the Name field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetName

`func (o *User) SetName(v string)`

SetName sets Name field to given value.


### GetPlaylistCount

`func (o *User) GetPlaylistCount() int32`

GetPlaylistCount returns the PlaylistCount field if non-nil, zero value otherwise.

### GetPlaylistCountOk

`func (o *User) GetPlaylistCountOk() (*int32, bool)`

GetPlaylistCountOk returns a tuple with the PlaylistCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPlaylistCount

`func (o *User) SetPlaylistCount(v int32)`

SetPlaylistCount sets PlaylistCount field to given value.


### GetProfilePicture

`func (o *User) GetProfilePicture() ProfilePicture`

GetProfilePicture returns the ProfilePicture field if non-nil, zero value otherwise.

### GetProfilePictureOk

`func (o *User) GetProfilePictureOk() (*ProfilePicture, bool)`

GetProfilePictureOk returns a tuple with the ProfilePicture field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetProfilePicture

`func (o *User) SetProfilePicture(v ProfilePicture)`

SetProfilePicture sets ProfilePicture field to given value.

### HasProfilePicture

`func (o *User) HasProfilePicture() bool`

HasProfilePicture returns a boolean if a field has been set.

### GetRepostCount

`func (o *User) GetRepostCount() int32`

GetRepostCount returns the RepostCount field if non-nil, zero value otherwise.

### GetRepostCountOk

`func (o *User) GetRepostCountOk() (*int32, bool)`

GetRepostCountOk returns a tuple with the RepostCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRepostCount

`func (o *User) SetRepostCount(v int32)`

SetRepostCount sets RepostCount field to given value.


### GetTrackCount

`func (o *User) GetTrackCount() int32`

GetTrackCount returns the TrackCount field if non-nil, zero value otherwise.

### GetTrackCountOk

`func (o *User) GetTrackCountOk() (*int32, bool)`

GetTrackCountOk returns a tuple with the TrackCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTrackCount

`func (o *User) SetTrackCount(v int32)`

SetTrackCount sets TrackCount field to given value.


### GetIsDeactivated

`func (o *User) GetIsDeactivated() bool`

GetIsDeactivated returns the IsDeactivated field if non-nil, zero value otherwise.

### GetIsDeactivatedOk

`func (o *User) GetIsDeactivatedOk() (*bool, bool)`

GetIsDeactivatedOk returns a tuple with the IsDeactivated field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetIsDeactivated

`func (o *User) SetIsDeactivated(v bool)`

SetIsDeactivated sets IsDeactivated field to given value.


### GetErcWallet

`func (o *User) GetErcWallet() string`

GetErcWallet returns the ErcWallet field if non-nil, zero value otherwise.

### GetErcWalletOk

`func (o *User) GetErcWalletOk() (*string, bool)`

GetErcWalletOk returns a tuple with the ErcWallet field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetErcWallet

`func (o *User) SetErcWallet(v string)`

SetErcWallet sets ErcWallet field to given value.

### HasErcWallet

`func (o *User) HasErcWallet() bool`

HasErcWallet returns a boolean if a field has been set.

### GetSplWallet

`func (o *User) GetSplWallet() string`

GetSplWallet returns the SplWallet field if non-nil, zero value otherwise.

### GetSplWalletOk

`func (o *User) GetSplWalletOk() (*string, bool)`

GetSplWalletOk returns a tuple with the SplWallet field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSplWallet

`func (o *User) SetSplWallet(v string)`

SetSplWallet sets SplWallet field to given value.


### GetSupporterCount

`func (o *User) GetSupporterCount() int32`

GetSupporterCount returns the SupporterCount field if non-nil, zero value otherwise.

### GetSupporterCountOk

`func (o *User) GetSupporterCountOk() (*int32, bool)`

GetSupporterCountOk returns a tuple with the SupporterCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSupporterCount

`func (o *User) SetSupporterCount(v int32)`

SetSupporterCount sets SupporterCount field to given value.


### GetSupportingCount

`func (o *User) GetSupportingCount() int32`

GetSupportingCount returns the SupportingCount field if non-nil, zero value otherwise.

### GetSupportingCountOk

`func (o *User) GetSupportingCountOk() (*int32, bool)`

GetSupportingCountOk returns a tuple with the SupportingCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSupportingCount

`func (o *User) SetSupportingCount(v int32)`

SetSupportingCount sets SupportingCount field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


