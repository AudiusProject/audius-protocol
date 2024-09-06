package chain

// sometimes the same tx can make it into a block, this removes them
func removeDuplicateTxs(txs [][]byte) [][]byte {
	seenTxs := make(map[string]struct{})
	dedupedTxs := make([][]byte, 0)

	for _, tx := range txs {
		key := string(tx)
		if _, ok := seenTxs[key]; !ok {
			seenTxs[key] = struct{}{}
			dedupedTxs = append(dedupedTxs, tx)
		}
	}

	return dedupedTxs
}
