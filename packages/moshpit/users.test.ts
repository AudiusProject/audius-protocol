import { describe, it, expect } from "vitest"
import { TestUser } from "./utils/users"

describe("Users", () => {
    it("should create and modify a user", async () => {
        const alec = await TestUser.new("alec")
        const alecUser = await alec.sdk().users.getUserByHandle({
            handle: alec.handle
        })
        const alecUserId = alecUser.data?.id!

        await alec.sdk().users.updateProfile({
            userId: alecUserId,
            metadata: {
                bio: "sup"
            }
        })

        const bio = await alec.sdk().users.getUserByHandle({
            handle: alec.handle
        })

        expect(bio).equals("sup")
    })
})
