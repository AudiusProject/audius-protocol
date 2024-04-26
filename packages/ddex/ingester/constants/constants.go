package constants

type DDEXChoreography string

const (
	ERNReleaseByRelease DDEXChoreography = "ERNReleaseByRelease"
	ERNBatched          DDEXChoreography = "ERNBatched"
)

const (
	ReleaseStatusAwaitingParse     = "awaiting_parse"      // The release is waiting to be published
	ReleaseStatusAwaitingPublish   = "awaiting_publish"    // The release is waiting to be uploaded to Audius
	ReleaseStatusErrorUserMatch    = "error_user_match"    // The release didn't have a user that matched with an OAuthed Audius user
	ReleaseStatusErrorGenreMatch   = "error_genre_match"   // The release didn't have a genre that matched with an Audius genre
	ReleaseStatusErrorParsing      = "error_parsing"       // Some other error occurred during parsing. See ParseErrors
	ReleaseStatusErrorDuringUpload = "error_during_upload" // An error occurred while trying to publish to Audius
	ReleaseStatusErrorAfterUpload  = "error_after_upload"  // The release was published to Audius, but there was an error after publishing
	ReleaseStatusPublished         = "published"           // The release was successfully published to Audius
)

var SkipFiles = []string{".DS_STORE", "__MACOSX"}
