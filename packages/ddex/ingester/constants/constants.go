package constants

type DDEXChoreography string

const (
	ERNReleaseByRelease DDEXChoreography = "ERNReleaseByRelease"
	ERNBatched          DDEXChoreography = "ERNBatched"
)

const (
	DeliveryStatusParsing       = "parsing"        // The delivery was crawled, and its XML is being parsed
	DeliveryStatusSuccess       = "success"        // All releases were parsed and moved to PendingRelease. Over and done with forever, unless it will be re-processed for bug fixes. Even if we later fail to upload a PendingRelease created by this delivery, the delivery itself was successful
	DeliveryStatusErrorCrawling = "error_crawling" // There was an error crawling the delivery
	DeliveryStatusErrorParsing  = "error_parsing"  // There was an error parsing the crawled content. Any releases that were successfully parsed were ignored (not moved to PendingRelease)
	DeliveryStatusRejected      = "rejected"       // Crawling and parsing succeeded, but the delivery was rejected for some reason
)
