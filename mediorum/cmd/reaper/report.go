package reaper

import "fmt"

func bytesToGB(bytes int) float64 {
	return float64(bytes) / (1024 * 1024 * 1024)
}

func (r *Reaper) report() {
	gbNotInDB := bytesToGB(r.counter["not_in_db"]["bytes_used"])
	gbSegments := bytesToGB(r.counter["track"]["bytes_used"])
	gbCopy320 := bytesToGB(r.counter["copy320"]["bytes_used"])
	gbImage := bytesToGB(r.counter["image"]["bytes_used"])
	gbMetadata := bytesToGB(r.counter["metadata"]["bytes_used"])
	gbDir := bytesToGB(r.counter["dir"]["bytes_used"])
	totalGBUsed := gbNotInDB + gbSegments + gbCopy320 + gbImage + gbMetadata + gbDir

	fmt.Printf("NOT IN DB COUNT  : %d\n", r.counter["not_in_db"]["count"])
	fmt.Printf("          ERRORS : %d\n", r.counter["not_in_db"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbNotInDB)
	fmt.Printf("SEGMENTS  COUNT  : %d\n", r.counter["track"]["count"])
	fmt.Printf("          ERRORS : %d\n", r.counter["track"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbSegments)
	fmt.Printf("COPY320   COUNT  : %d\n", r.counter["copy320"]["count"])
	fmt.Printf("          ERRORS : %d\n", r.counter["copy320"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbCopy320)
	fmt.Printf("IMAGE     COUNT  : %d\n", r.counter["image"]["count"])
	fmt.Printf("          ERRORS : %d\n", r.counter["image"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbImage)
	fmt.Printf("METADATA  COUNT  : %d\n", r.counter["metadata"]["count"])
	fmt.Printf("          ERRORS : %d\n", r.counter["metadata"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbMetadata)
	fmt.Printf("DIR       COUNT  : %d\n", r.counter["dir"]["count"])
	fmt.Printf("          ERRORS : %d\n", r.counter["dir"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbDir)
	fmt.Printf("-----------------------\n")
	fmt.Printf("TOTAL     GB USED: %.2f\n", totalGBUsed)
	fmt.Printf("-----------------------\n")
}
