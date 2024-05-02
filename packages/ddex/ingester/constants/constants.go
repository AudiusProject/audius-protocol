package constants

type DDEXChoreography string

const (
	ERNReleaseByRelease DDEXChoreography = "ERNReleaseByRelease"
	ERNBatched          DDEXChoreography = "ERNBatched"
)

const (
	ReleaseStatusAwaitingParse      = "awaiting_parse"       // The release is waiting to be published
	ReleaseStatusAwaitingPublish    = "awaiting_publish"     // The release is waiting to be uploaded to Audius
	ReleaseStatusErrorUserMatch     = "error_user_match"     // The release didn't have a user that matched with an OAuthed Audius user
	ReleaseStatusErrorGenreMatch    = "error_genre_match"    // The release didn't have a genre that matched with an Audius genre
	ReleaseStatusErrorParsing       = "error_parsing"        // Some other error occurred during parsing. See ParseErrors
	ReleaseStatusFailedDuringUpload = "failed_during_upload" // An error occurred while trying to publish to Audius
	ReleaseStatusFailedAfterUpload  = "failed_after_upload"  // The release was published to Audius, but there was an error after publishing
	ReleaseStatusPublished          = "published"            // The release was successfully published to Audius
	ReleaseStatusAwaitingDelete     = "awaiting_delete"      // The release is waiting to be removed from Audius
	ReleaseStatusDeleted            = "deleted"              // The release was successfully removed from Audius
	ReleaseStatusFailedDuringDelete = "failed_during_delete" // An error occurred while trying to delete from Audius
	ReleaseStatusFailedAfterDelete  = "failed_after_delete"  // The release was removed from Audius, but there was an error after deletion
)

var SkipFiles = []string{".DS_STORE", "__MACOSX"}
