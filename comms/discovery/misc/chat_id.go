package misc

import "fmt"

// ChatID return a encodedUser1:encodedUser2 ID where encodedUser1 is < encodedUser2
// which is the convention used to make chat IDs deterministic.
// See makeChatId in SDK: packages/common/src/store/pages/chat/utils.ts
func ChatID(id1, id2 int) string {
	user1IdEncoded, _ := EncodeHashId(id1)
	user2IdEncoded, _ := EncodeHashId(id2)
	chatId := fmt.Sprintf("%s:%s", user1IdEncoded, user2IdEncoded)
	if user2IdEncoded < user1IdEncoded {
		chatId = fmt.Sprintf("%s:%s", user2IdEncoded, user1IdEncoded)
	}
	return chatId
}
