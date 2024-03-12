package artistutils

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// CreateArtistNameIndex creates an index on the name (display name) field in the 'users' collection
func CreateArtistNameIndex(usersColl *mongo.Collection, ctx context.Context) error {
	_, err := usersColl.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.M{"name": 1},
	})
	if err != nil {
		return err
	}
	return nil
}

// GetArtistID searches Mongo OAuthed artists for an exact match on artistName (display name) and returns the artist's ID
func GetArtistID(artistName string, usersColl *mongo.Collection, ctx context.Context) (string, error) {
	filter := bson.M{"name": artistName}
	cursor, err := usersColl.Find(ctx, filter)
	if err != nil {
		return "", err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return "", err
	}

	// Fail if multiple artists have their display name set to the same string
	if len(results) > 1 {
		var handles []string
		for _, result := range results {
			if handle, ok := result["handle"].(string); ok {
				handles = append(handles, "@"+handle)
			}
		}
		idsStr := strings.Join(handles, ", ")
		return "", fmt.Errorf("error: more than one artist found with the same display name: %s", idsStr)
	}

	// Fail if no artist is found, and use /v1/users/search to display potential matches in the error message
	if len(results) == 0 {
		return searchArtistOnAudius(artistName)
	}

	artistID, ok := results[0]["_id"].(string)
	if !ok {
		return "", errors.New("error: unable to parse artist ID")
	}
	return artistID, nil
}

// searchArtistOnAudius searches Audius (public /v1/users/search endpoint) for an artist by name and returns potential matches.
// NOTE: This is neither exact nor deterministic. It may return an artist with a non-exact match even if an exact match exists because of other metrics like follower count
func searchArtistOnAudius(artistName string) (string, error) {
	type AudiusUser struct {
		Handle     string `json:"handle"`
		ID         string `json:"id"`
		IsVerified bool   `json:"is_verified"`
		Name       string `json:"name"`
	}

	url := fmt.Sprintf("https://discoveryprovider.audius.co/v1/users/search?query=%s", artistName)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var data struct {
		Data []AudiusUser `json:"data"`
	}
	if err = json.Unmarshal(body, &data); err != nil {
		return "", err
	}

	// Include potential matches in the error message for manual review
	errMsg := "No artist found in the database. Found on Audius: "
	for _, user := range data.Data {
		errMsg += fmt.Sprintf("{ Handle: %s, ID: %s, Verified: %t, Name: %s } ", user.Handle, user.ID, user.IsVerified, user.Name)
	}
	return "", errors.New(errMsg)
}
