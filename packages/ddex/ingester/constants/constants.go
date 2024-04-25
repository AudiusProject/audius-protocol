package constants

type DDEXChoreography string

const (
	ERNReleaseByRelease DDEXChoreography = "ERNReleaseByRelease"
	ERNBatched          DDEXChoreography = "ERNBatched"
)

// TODO: We don't want to store statuses about deliveries for the most part. We should just store the releases and batches
const (
	DeliveryStatusParsing       = "parsing"        // The delivery was crawled, and its XML is being parsed
	DeliveryStatusSuccess       = "success"        // All releases were parsed and moved to PendingRelease. Over and done with forever, unless it will be re-processed for bug fixes. Even if we later fail to upload a PendingRelease created by this delivery, the delivery itself was successful
	DeliveryStatusErrorCrawling = "error_crawling" // There was an error crawling the delivery
	DeliveryStatusErrorParsing  = "error_parsing"  // There was an error parsing the crawled content. Any releases that were successfully parsed were ignored (not moved to PendingRelease)
	DeliveryStatusRejected      = "rejected"       // Crawling and parsing succeeded, but the delivery was rejected for some reason
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
