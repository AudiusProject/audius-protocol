package config

import "strings"

var (

	// Rate limit config
	RateLimitRulesBucketName            = "rateLimitRules"
	RateLimitTimeframeHours             = "timeframeHours"
	RateLimitMaxNumMessages             = "maxNumMessages"
	RateLimitMaxNumMessagesPerRecipient = "maxNumMessagesPerRecipient"
	RateLimitMaxNumNewChats             = "maxNumNewChats"

	DefaultRateLimitRules = map[string]int{
		RateLimitTimeframeHours:             24,
		RateLimitMaxNumMessages:             2000,
		RateLimitMaxNumMessagesPerRecipient: 1000,
		RateLimitMaxNumNewChats:             100000,
	}

	// honorary nodes used to create db snapshots
	// are allowed read access.
	honoraryNodes = []string{
		// stage-discovery-4
		"0xb1C931A9ac123866372CEbb6bbAF50FfD18dd5DF",
		// prod-discovery-4
		"0x32bF5092890bb03A45bd03AaeFAd11d4afC9a851",
	}
)

func IsHonoraryNode(wallet string) bool {
	for _, hon := range honoraryNodes {
		if strings.EqualFold(wallet, hon) {
			return true
		}
	}
	return false
}
