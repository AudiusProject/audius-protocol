package em

type UserMetadata struct {
	IsVerified          bool        `json:"is_verified"`
	IsDeactivated       bool        `json:"is_deactivated"`
	Name                string      `json:"name"`
	Handle              string      `json:"handle"`
	ProfilePicture      interface{} `json:"profile_picture"`
	ProfilePictureSizes string      `json:"profile_picture_sizes"`
	CoverPhoto          interface{} `json:"cover_photo"`
	CoverPhotoSizes     string      `json:"cover_photo_sizes"`
	Bio                 string      `json:"bio"`
	Location            string      `json:"location"`
	ArtistPickTrackID   interface{} `json:"artist_pick_track_id"`
	CreatorNodeEndpoint string      `json:"creator_node_endpoint"`
	AssociatedWallets   struct {
		ZeroX05A933CDcABF2FCF40FFc2Ce1B7FD63F74F16Cd2 struct {
			Signature string `json:"signature"`
		} `json:"0x05A933CDcABF2fCF40fFc2ce1b7fD63F74F16cd2"`
	} `json:"associated_wallets"`
	AssociatedSolWallets struct {
		EGTKtB1GqwUTCocLPFuo56RootQTEp7R7PRQS7YTyTvf struct {
			Signature string `json:"signature"`
		} `json:"EGTKtB1gqwUTCocLPFuo56rootQTEp7r7PRQS7YTyTvf"`
	} `json:"associated_sol_wallets"`
	Collectibles    interface{} `json:"collectibles"`
	PlaylistLibrary struct {
		Contents []struct {
			PlaylistID int    `json:"playlist_id"`
			Type       string `json:"type"`
		} `json:"contents"`
	} `json:"playlist_library"`
	Events struct {
		IsMobileUser bool `json:"is_mobile_user"`
	} `json:"events"`
	UserID int `json:"user_id"`
}

type TrackMetadata struct {
	OwnerID       int         `json:"owner_id"`
	Title         string      `json:"title"`
	Length        interface{} `json:"length"`
	CoverArt      interface{} `json:"cover_art"`
	CoverArtSizes string      `json:"cover_art_sizes"`
	Tags          interface{} `json:"tags"`
	Genre         string      `json:"genre"`
	Mood          interface{} `json:"mood"`
	CreditsSplits interface{} `json:"credits_splits"`
	CreatedAt     interface{} `json:"created_at"`
	CreateDate    interface{} `json:"create_date"`
	UpdatedAt     interface{} `json:"updated_at"`
	ReleaseDate   string      `json:"release_date"`
	FileType      interface{} `json:"file_type"`
	TrackSegments []struct {
		Multihash string  `json:"multihash"`
		Duration  float64 `json:"duration"`
	} `json:"track_segments"`
	HasCurrentUserReposted bool          `json:"has_current_user_reposted"`
	FolloweeReposts        []interface{} `json:"followee_reposts"`
	FolloweeSaves          []interface{} `json:"followee_saves"`
	IsCurrent              bool          `json:"is_current"`
	IsUnlisted             bool          `json:"is_unlisted"`
	IsPremium              bool          `json:"is_premium"`
	PremiumConditions      interface{}   `json:"premium_conditions"`
	FieldVisibility        struct {
		Genre     bool `json:"genre"`
		Mood      bool `json:"mood"`
		Tags      bool `json:"tags"`
		Share     bool `json:"share"`
		PlayCount bool `json:"play_count"`
		Remixes   bool `json:"remixes"`
	} `json:"field_visibility"`
	RemixOf     interface{} `json:"remix_of"`
	RepostCount int         `json:"repost_count"`
	SaveCount   int         `json:"save_count"`
	Description interface{} `json:"description"`
	License     string      `json:"license"`
	Isrc        interface{} `json:"isrc"`
	Iswc        interface{} `json:"iswc"`
	Download    interface{} `json:"download"`
	Artwork     struct {
		URL  string `json:"url"`
		File struct {
		} `json:"file"`
		Source string `json:"source"`
	} `json:"artwork"`
	StemOf interface{} `json:"stem_of"`
}
