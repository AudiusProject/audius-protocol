package common

type Genre string

const (
	AllGenres        Genre = "All Genres"
	Electronic       Genre = "Electronic"
	Rock             Genre = "Rock"
	Metal            Genre = "Metal"
	Alternative      Genre = "Alternative"
	HipHopRap        Genre = "Hip-Hop/Rap"
	Experimental     Genre = "Experimental"
	Punk             Genre = "Punk"
	Folk             Genre = "Folk"
	Pop              Genre = "Pop"
	Ambient          Genre = "Ambient"
	Soundtrack       Genre = "Soundtrack"
	World            Genre = "World"
	Jazz             Genre = "Jazz"
	Acoustic         Genre = "Acoustic"
	Funk             Genre = "Funk"
	RandBSoul        Genre = "R&B/Soul"
	Devotional       Genre = "Devotional"
	Classical        Genre = "Classical"
	Reggae           Genre = "Reggae"
	Podcasts         Genre = "Podcasts"
	Country          Genre = "Country"
	SpokenWord       Genre = "Spoken Word"
	Comedy           Genre = "Comedy"
	Blues            Genre = "Blues"
	Kids             Genre = "Kids"
	Audiobooks       Genre = "Audiobooks"
	Latin            Genre = "Latin"
	LoFi             Genre = "Lo-Fi"
	Hyperpop         Genre = "Hyperpop"
	Techno           Genre = "Techno"
	Trap             Genre = "Trap"
	House            Genre = "House"
	TechHouse        Genre = "Tech House"
	DeepHouse        Genre = "Deep House"
	Disco            Genre = "Disco"
	Electro          Genre = "Electro"
	Jungle           Genre = "Jungle"
	ProgressiveHouse Genre = "Progressive House"
	Hardstyle        Genre = "Hardstyle"
	GlitchHop        Genre = "Glitch Hop"
	Trance           Genre = "Trance"
	FutureBass       Genre = "Future Bass"
	FutureHouse      Genre = "Future House"
	TropicalHouse    Genre = "Tropical House"
	Downtempo        Genre = "Downtempo"
	DrumAndBass      Genre = "Drum & Bass"
	Dubstep          Genre = "Dubstep"
	JerseyClub       Genre = "Jersey Club"
	Vaporwave        Genre = "Vaporwave"
	Moombahton       Genre = "Moombahton"
)

var stringToGenre = map[string]Genre{
	"All Genres":        AllGenres,
	"Electronic":        Electronic,
	"Rock":              Rock,
	"Metal":             Metal,
	"Alternative":       Alternative,
	"Hip-Hop/Rap":       HipHopRap,
	"Experimental":      Experimental,
	"Punk":              Punk,
	"Folk":              Folk,
	"Pop":               Pop,
	"Ambient":           Ambient,
	"Soundtrack":        Soundtrack,
	"World":             World,
	"Jazz":              Jazz,
	"Acoustic":          Acoustic,
	"Funk":              Funk,
	"R&B/Soul":          RandBSoul,
	"Devotional":        Devotional,
	"Classical":         Classical,
	"Reggae":            Reggae,
	"Podcasts":          Podcasts,
	"Country":           Country,
	"Spoken Word":       SpokenWord,
	"Comedy":            Comedy,
	"Blues":             Blues,
	"Kids":              Kids,
	"Audiobooks":        Audiobooks,
	"Latin":             Latin,
	"Lo-Fi":             LoFi,
	"Hyperpop":          Hyperpop,
	"Techno":            Techno,
	"Trap":              Trap,
	"House":             House,
	"Tech House":        TechHouse,
	"Deep House":        DeepHouse,
	"Disco":             Disco,
	"Electro":           Electro,
	"Jungle":            Jungle,
	"Progressive House": ProgressiveHouse,
	"Hardstyle":         Hardstyle,
	"Glitch Hop":        GlitchHop,
	"Trance":            Trance,
	"Future Bass":       FutureBass,
	"Future House":      FutureHouse,
	"Tropical House":    TropicalHouse,
	"Downtempo":         Downtempo,
	"Drum & Bass":       DrumAndBass,
	"Dubstep":           Dubstep,
	"Jersey Club":       JerseyClub,
	"Vaporwave":         Vaporwave,
	"Moombahton":        Moombahton,
}

func ToGenre(s string) (Genre, bool) {
	// Manually match genres that aren't part of the official set
	if s == "Hip Hop" {
		return HipHopRap, true
	}

	genre, ok := stringToGenre[s]
	return genre, ok
}

type Mood string

const (
	Peaceful      Mood = "Peaceful"
	Romantic      Mood = "Romantic"
	Sentimental   Mood = "Sentimental"
	Tender        Mood = "Tender"
	Easygoing     Mood = "Easygoing"
	Yearning      Mood = "Yearning"
	Sophisticated Mood = "Sophisticated"
	Sensual       Mood = "Sensual"
	Cool          Mood = "Cool"
	Gritty        Mood = "Gritty"
	Melancholy    Mood = "Melancholy"
	Serious       Mood = "Serious"
	Brooding      Mood = "Brooding"
	Fiery         Mood = "Fiery"
	Defiant       Mood = "Defiant"
	Aggressive    Mood = "Aggressive"
	Rowdy         Mood = "Rowdy"
	Excited       Mood = "Excited"
	Energizing    Mood = "Energizing"
	Empowering    Mood = "Empowering"
	Stirring      Mood = "Stirring"
	Upbeat        Mood = "Upbeat"
	Other         Mood = "Other"
)

type CID string

type NullableBool = *bool
type NullableString = *string
type NullableInt = *int

type TrackSegment struct {
	Duration  string `json:"duration"`
	Multihash CID    `json:"multihash"`
}

type Download struct {
	IsDownloadable NullableBool   `json:"is_downloadable"`
	RequiresFollow NullableBool   `json:"requires_follow"`
	CID            NullableString `json:"cid"`
}

type TokenStandard string

const (
	ERC721  TokenStandard = "ERC721"
	ERC1155 TokenStandard = "ERC1155"
)

type EthCollectibleGatedConditions struct {
	Chain        string         `json:"chain"`
	Standard     TokenStandard  `json:"standard"`
	Address      string         `json:"address"`
	Name         string         `json:"name"`
	Slug         string         `json:"slug"`
	ImageUrl     NullableString `json:"imageUrl"`
	ExternalLink NullableString `json:"externalLink"`
}

type SolCollectibleGatedConditions struct {
	Chain        string         `json:"chain"`
	Address      string         `json:"address"`
	Name         string         `json:"name"`
	ImageUrl     NullableString `json:"imageUrl"`
	ExternalLink NullableString `json:"externalLink"`
}

type USDCPurchaseConditions struct {
	USDCPurchase *struct {
		Price  float64            `json:"price"`
		Splits map[string]float64 `json:"splits"`
	} `json:"usdc_purchase,omitempty"`
}

type GatedConditions struct {
	NFTCollection *interface{} `json:"nft_collection,omitempty"`
	FollowUserID  NullableInt  `json:"follow_user_id,omitempty"`
	TipUserID     NullableInt  `json:"tip_user_id,omitempty"`
	USDCPurchaseConditions
}

type TrackMetadata struct {
	Title               string         `json:"title"`
	ReleaseDate         string         `json:"release_date"`
	Genre               Genre          `json:"genre"`
	Duration            int            `json:"duration"`
	PreviewStartSeconds NullableInt    `json:"preview_start_seconds,omitempty"`
	ISRC                NullableString `json:"isrc,omitempty"`

	// TODO: Handle License from PLineText?
	License NullableString `json:"license,omitempty"`

	// TODO: We may have to leave these ones out
	Description NullableString `json:"description,omitempty"` // Apparently there's supposed to be a <MarketingComment> that we use for this
	Mood        NullableString `json:"mood,omitempty"`
	Tags        NullableString `json:"tags,omitempty"`

	// Extra fields (not in SDK)
	Artists             []Artist `json:"artists"`
	ArtistName          string   `json:"artist_name"`
	Copyright           string   `json:"copyright"`
	PreviewAudioFileURL string   `json:"preview_audio_file_url"`
	AudioFileURL        string   `json:"audio_file_url"`
	CoverArtURL         string   `json:"cover_art_url"`
}

// Not part of SDK
type Artist struct {
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
}

type CollectionMetadata struct {
	PlaylistName    string         `json:"playlist_name"`
	PlaylistOwnerID string         `json:"playlist_owner_id"`
	Description     NullableString `json:"description,omitempty"`
	IsAlbum         bool           `json:"is_album"`
	IsPrivate       bool           `json:"is_private"`
	Tags            NullableString `json:"tags,omitempty"`
	Genre           Genre          `json:"genre"`
	Mood            Mood           `json:"mood"`
	ReleaseDate     string         `json:"release_date"`

	// TODO: Handle these fields
	License NullableString `json:"license,omitempty"`
	UPC     NullableString `json:"upc,omitempty"`

	// Extra fields (not in SDK)
	CoverArtURL string `json:"cover_art_url"`
}
