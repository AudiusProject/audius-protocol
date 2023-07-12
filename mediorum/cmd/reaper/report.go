package reaper

import "fmt"

func report(b *Batcher) {
	gbNotInDB := float64(b.counter["not_in_db"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbSegments := float64(b.counter["track"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbCopy320 := float64(b.counter["copy320"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbImage := float64(b.counter["image"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbMetadata := float64(b.counter["metadata"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbDir := float64(b.counter["dir"]["bytes_used"]) / (1024 * 1024 * 1024)
	totalGBUsed := gbNotInDB + gbSegments + gbCopy320 + gbImage + gbMetadata + gbDir

	fmt.Printf("NOT IN DB COUNT  : %d\n", b.counter["not_in_db"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["not_in_db"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbNotInDB)
	fmt.Printf("SEGMENTS  COUNT  : %d\n", b.counter["track"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["track"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbSegments)
	fmt.Printf("COPY320   COUNT  : %d\n", b.counter["copy320"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["copy320"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbCopy320)
	fmt.Printf("IMAGE     COUNT  : %d\n", b.counter["image"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["image"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbImage)
	fmt.Printf("METADATA  COUNT  : %d\n", b.counter["metadata"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["metadata"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbMetadata)
	fmt.Printf("DIR       COUNT  : %d\n", b.counter["dir"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["dir"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbDir)
	fmt.Printf("-----------------------\n")
	fmt.Printf("TOTAL     GB USED: %.2f\n", totalGBUsed)
	fmt.Printf("-----------------------\n")
}
