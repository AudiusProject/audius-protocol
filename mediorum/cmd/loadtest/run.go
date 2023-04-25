package loadtest

import (
	"fmt"
	"sync"
	"time"
)

func Run(tc *TestClient, num int) {

	wg := sync.WaitGroup{}

	fmt.Println("____________________\nDoUpload")
	for i := 0; i < num; i++ {
		time.Sleep(time.Millisecond * 100) // throttle
		wg.Add(1)
		go tc.DoUpload(&wg, i)
	}
	wg.Wait()

	fmt.Println("____________________\nReport")
	tc.Report(&wg)
	wg.Wait()

	fmt.Println("____________________\nComplete")
}
