# Playlist

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Artwork** | Pointer to [**PlaylistArtwork**](PlaylistArtwork.md) |  | [optional] 
**Description** | Pointer to **string** |  | [optional] 
**Permalink** | Pointer to **string** |  | [optional] 
**Id** | **string** |  | 
**IsAlbum** | **bool** |  | 
**PlaylistName** | **string** |  | 
**RepostCount** | **int32** |  | 
**FavoriteCount** | **int32** |  | 
**TotalPlayCount** | **int32** |  | 
**User** | [**User**](User.md) |  | 

## Methods

### NewPlaylist

`func NewPlaylist(id string, isAlbum bool, playlistName string, repostCount int32, favoriteCount int32, totalPlayCount int32, user User, ) *Playlist`

NewPlaylist instantiates a new Playlist object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewPlaylistWithDefaults

`func NewPlaylistWithDefaults() *Playlist`

NewPlaylistWithDefaults instantiates a new Playlist object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetArtwork

`func (o *Playlist) GetArtwork() PlaylistArtwork`

GetArtwork returns the Artwork field if non-nil, zero value otherwise.

### GetArtworkOk

`func (o *Playlist) GetArtworkOk() (*PlaylistArtwork, bool)`

GetArtworkOk returns a tuple with the Artwork field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetArtwork

`func (o *Playlist) SetArtwork(v PlaylistArtwork)`

SetArtwork sets Artwork field to given value.

### HasArtwork

`func (o *Playlist) HasArtwork() bool`

HasArtwork returns a boolean if a field has been set.

### GetDescription

`func (o *Playlist) GetDescription() string`

GetDescription returns the Description field if non-nil, zero value otherwise.

### GetDescriptionOk

`func (o *Playlist) GetDescriptionOk() (*string, bool)`

GetDescriptionOk returns a tuple with the Description field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDescription

`func (o *Playlist) SetDescription(v string)`

SetDescription sets Description field to given value.

### HasDescription

`func (o *Playlist) HasDescription() bool`

HasDescription returns a boolean if a field has been set.

### GetPermalink

`func (o *Playlist) GetPermalink() string`

GetPermalink returns the Permalink field if non-nil, zero value otherwise.

### GetPermalinkOk

`func (o *Playlist) GetPermalinkOk() (*string, bool)`

GetPermalinkOk returns a tuple with the Permalink field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPermalink

`func (o *Playlist) SetPermalink(v string)`

SetPermalink sets Permalink field to given value.

### HasPermalink

`func (o *Playlist) HasPermalink() bool`

HasPermalink returns a boolean if a field has been set.

### GetId

`func (o *Playlist) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *Playlist) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *Playlist) SetId(v string)`

SetId sets Id field to given value.


### GetIsAlbum

`func (o *Playlist) GetIsAlbum() bool`

GetIsAlbum returns the IsAlbum field if non-nil, zero value otherwise.

### GetIsAlbumOk

`func (o *Playlist) GetIsAlbumOk() (*bool, bool)`

GetIsAlbumOk returns a tuple with the IsAlbum field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetIsAlbum

`func (o *Playlist) SetIsAlbum(v bool)`

SetIsAlbum sets IsAlbum field to given value.


### GetPlaylistName

`func (o *Playlist) GetPlaylistName() string`

GetPlaylistName returns the PlaylistName field if non-nil, zero value otherwise.

### GetPlaylistNameOk

`func (o *Playlist) GetPlaylistNameOk() (*string, bool)`

GetPlaylistNameOk returns a tuple with the PlaylistName field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPlaylistName

`func (o *Playlist) SetPlaylistName(v string)`

SetPlaylistName sets PlaylistName field to given value.


### GetRepostCount

`func (o *Playlist) GetRepostCount() int32`

GetRepostCount returns the RepostCount field if non-nil, zero value otherwise.

### GetRepostCountOk

`func (o *Playlist) GetRepostCountOk() (*int32, bool)`

GetRepostCountOk returns a tuple with the RepostCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRepostCount

`func (o *Playlist) SetRepostCount(v int32)`

SetRepostCount sets RepostCount field to given value.


### GetFavoriteCount

`func (o *Playlist) GetFavoriteCount() int32`

GetFavoriteCount returns the FavoriteCount field if non-nil, zero value otherwise.

### GetFavoriteCountOk

`func (o *Playlist) GetFavoriteCountOk() (*int32, bool)`

GetFavoriteCountOk returns a tuple with the FavoriteCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetFavoriteCount

`func (o *Playlist) SetFavoriteCount(v int32)`

SetFavoriteCount sets FavoriteCount field to given value.


### GetTotalPlayCount

`func (o *Playlist) GetTotalPlayCount() int32`

GetTotalPlayCount returns the TotalPlayCount field if non-nil, zero value otherwise.

### GetTotalPlayCountOk

`func (o *Playlist) GetTotalPlayCountOk() (*int32, bool)`

GetTotalPlayCountOk returns a tuple with the TotalPlayCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTotalPlayCount

`func (o *Playlist) SetTotalPlayCount(v int32)`

SetTotalPlayCount sets TotalPlayCount field to given value.


### GetUser

`func (o *Playlist) GetUser() User`

GetUser returns the User field if non-nil, zero value otherwise.

### GetUserOk

`func (o *Playlist) GetUserOk() (*User, bool)`

GetUserOk returns a tuple with the User field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetUser

`func (o *Playlist) SetUser(v User)`

SetUser sets User field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


