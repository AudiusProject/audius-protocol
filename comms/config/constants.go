package config

var (
	SigHeader = "x-sig"

	PubkeystoreBucketName = "pubkeyStore"

	// Rate limit config
	RateLimitRulesBucketName            = "rateLimitRules"
	RateLimitTimeframeHours             = "timeframeHours"
	RateLimitMaxNumMessages             = "maxNumMessages"
	RateLimitMaxNumMessagesPerRecipient = "maxNumMessagesPerRecipient"
	RateLimitMaxNumNewChats             = "maxNumNewChats"

	RateLimitRules = map[string]string{
		RateLimitTimeframeHours:             "24",
		RateLimitMaxNumMessages:             "2000",
		RateLimitMaxNumMessagesPerRecipient: "1000",
		RateLimitMaxNumNewChats:             "100",
	}
)
