package misc

import (
	"encoding/json"
	"fmt"
)

func PrettyPrint(obj interface{}) {
	b, err := json.MarshalIndent(obj, "", "\t")
	if err != nil {
		fmt.Println("PrettyPrint failed:", err, obj)
		return
	}
	fmt.Println(string(b))
}
