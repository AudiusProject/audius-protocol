package pages

import "github.com/iancoleman/strcase"

func CamelCaseKeys(result []map[string]interface{}) []map[string]interface{} {
	newResult := make([]map[string]interface{}, len(result))
	for i, m := range result {
		newMap := make(map[string]interface{})
		for k, v := range m {
			newKey := strcase.ToSnake(k)
			newMap[newKey] = v
		}
		newResult[i] = newMap
	}
	return newResult
}
