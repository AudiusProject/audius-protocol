package artistutils

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"ingester/common"
	"io"
	"net/http"
	"sort"
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

// GetFirstArtistID searches Mongo OAuthed artists for the first match on the track's display artists' names
// and returns that artist's ID
func GetFirstArtistID(artists []common.Artist, usersColl *mongo.Collection, ctx context.Context) (string, string, []string, error) {
	// Sort artists by SequenceNumber (asc)
	sort.Slice(artists, func(i, j int) bool {
		return artists[i].SequenceNumber < artists[j].SequenceNumber
	})

	artistID := ""
	artistName := ""
	var err error
	var warnings []string
	for _, artist := range artists {
		filter := bson.M{"name": artist.Name}
		cursor, err := usersColl.Find(ctx, filter)
		if err != nil {
			return "", "", warnings, err
		}
		defer cursor.Close(ctx)

		var results []bson.M
		if err = cursor.All(ctx, &results); err != nil {
			return "", "", warnings, err
		}

		// Continue to the next display artist if multiple artists have their display name set to this artist.Name
		if len(results) > 1 {
			var handles []string
			for _, result := range results {
				if handle, ok := result["handle"].(string); ok {
					handles = append(handles, "@"+handle)
				}
			}
			idsStr := strings.Join(handles, ", ")
			warnings = append(warnings, fmt.Sprintf("error: more than one artist found with the same display name %s: %s", artist.Name, idsStr))
			continue
		}

		// Continue to the next display artist if no artist is found, and use /v1/users/search to display potential
		// matches in the warnings
		if len(results) == 0 {
			id, err := searchArtistOnAudius(artist.Name)
			if err != nil {
				warnings = append(warnings, err.Error())
				continue
			}
			// Unreachable for now
			artistID = id
			artistName = artist.Name
			err = nil
			break
		}

		id, ok := results[0]["_id"].(string)
		if !ok {
			warnings = append(warnings, "error: unable to parse _id from the users collection")
			continue
		}

		// Found first OAuthed artist ID
		artistID = id
		artistName = artist.Name
		err = nil
		break
	}

	if artistID != "" {
		return artistID, artistName, warnings, nil
	}
	return "", "", warnings, err
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
