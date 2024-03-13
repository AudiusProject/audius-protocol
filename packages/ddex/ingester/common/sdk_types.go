package common

import "time"

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

type ReleaseIDs struct {
	PartyID       string `bson:"party_id"`
	ICPN          string `bson:"icpn"`
	GRid          string `bson:"grid"`
	ISAN          string `bson:"isan"`
	ISBN          string `bson:"isbn"`
	ISMN          string `bson:"ismn"`
	ISRC          string `bson:"isrc"`
	ISSN          string `bson:"issn"`
	ISTC          string `bson:"istc"`
	ISWC          string `bson:"iswc"`
	MWLI          string `bson:"mwli"`
	SICI          string `bson:"sici"`
	ProprietaryID string `bson:"proprietary_id"`
}

type TrackMetadata struct {
	Title               string         `bson:"title"`
	ReleaseDate         time.Time      `bson:"release_date"`
	Genre               Genre          `bson:"genre"`
	Duration            int            `bson:"duration"`
	PreviewStartSeconds NullableInt    `bson:"preview_start_seconds,omitempty"`
	ISRC                NullableString `bson:"isrc,omitempty"`
	DDEXReleaseIDs      ReleaseIDs     `bson:"ddex_release_ids"`

	// TODO: Handle License from PLineText?
	License NullableString `bson:"license,omitempty"`

	// TODO: We may have to leave these ones out
	Description NullableString `bson:"description,omitempty"` // Apparently there's supposed to be a <MarketingComment> that we use for this
	Mood        NullableString `bson:"mood,omitempty"`
	Tags        NullableString `bson:"tags,omitempty"`

	// Extra fields (not in SDK)
	Artists                     []Artist `bson:"artists"`
	ArtistID                    string   `bson:"artist_id"`
	ArtistName                  string   `bson:"artist_name"`
	Copyright                   string   `bson:"copyright"`
	PreviewAudioFileURL         string   `bson:"preview_audio_file_url"`
	PreviewAudioFileURLHash     string   `bson:"preview_audio_file_url_hash"`
	PreviewAudioFileURLHashAlgo string   `bson:"preview_audio_file_url_hash_algo"`
	AudioFileURL                string   `bson:"audio_file_url"`
	AudioFileURLHash            string   `bson:"audio_file_url_hash"`
	AudioFileURLHashAlgo        string   `bson:"audio_file_url_hash_algo"`
	CoverArtURL                 string   `bson:"cover_art_url"`
	CoverArtURLHash             string   `bson:"cover_art_url_hash"`
	CoverArtURLHashAlgo         string   `bson:"cover_art_url_hash_algo"`
}

// Not part of SDK
type Artist struct {
	Name  string   `bson:"name"`
	Roles []string `bson:"roles"`
}

type CollectionMetadata struct {
	PlaylistName      string         `bson:"playlist_name"`
	PlaylistOwnerID   string         `bson:"playlist_owner_id"`
	PlaylistOwnerName string         `bson:"playlist_owner_name"`
	Description       NullableString `bson:"description,omitempty"`
	IsAlbum           bool           `bson:"is_album"`
	IsPrivate         bool           `bson:"is_private"`
	Tags              NullableString `bson:"tags,omitempty"`
	Genre             Genre          `bson:"genre"`
	Mood              Mood           `bson:"mood,omitempty"`
	ReleaseDate       time.Time      `bson:"release_date"`
	DDEXReleaseIDs    ReleaseIDs     `bson:"ddex_release_ids"`

	// TODO: Handle these fields
	License NullableString `bson:"license,omitempty"`
	UPC     NullableString `bson:"upc,omitempty"`

	// Extra fields (not in SDK)
	CoverArtURL         string `bson:"cover_art_url"`
	CoverArtURLHash     string `bson:"cover_art_url_hash"`
	CoverArtURLHashAlgo string `bson:"cover_art_url_hash_algo"`
}
