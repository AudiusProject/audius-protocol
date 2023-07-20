package signing

var (
	SigHeader             = "x-sig"
	SignatureTimeToLiveMs = int64(1000 * 60 * 60 * 12) // 12 hours
)
