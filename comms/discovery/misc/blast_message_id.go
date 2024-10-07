package misc

// Returns a unique Message ID for a blast message in a chat.
func BlastMessageID(blastID, chatID string) string {
	return blastID + chatID
}
