# Oauth

## Methods

### oauth.init(`loginSuccessCallback`, `errorCallback`)

enables the Log In with Audius functionality.

**Params**

- loginSuccessCallback `(profile: UserProfile) => void` - function to be called when the user successfully authenticates with Audius. This function will be called with the user's profile information, which is an object with the following shape:

  ```typescript
  // type UserProfile =
  {
    userId: number; // unique Audius user identifier
    email: string;
    name: string; // user's display name
    handle: string;
    verified: boolean; // whether the user has the Audius "verified" checkmark

    /** URLs for the user's profile picture, if any.
    * If the user has a profile picture, three sizes will be available: 150x150, 480x480, and 1000x1000.
    * If the user has no profile picture, this field will be empty.
    */
    profilePicture: {"150x150": string, "480x480": string, "1000x1000": string } | { misc: string } | undefined | null
    sub: number; // alias for userId
    iat: string; // timestamp for when auth was performed
  }
  ```

- errorSuccessCallback _optional_ `(errorMessage: string) => void` - function to be called when an error occurs during the authentication flow. This function will be called with a string describing the error.

**Returns**: Nothing

### oauth.renderButton(`element`, `customizations`)

replaces the element passed in the first parameter with the Log In with Audius button

**Params**

- element `HTMLElement` - HTML element to replace with the Log In with Audius button
- customizations _optional_ `ButtonOptions` - optional object containing the customization settings for the button to be rendered. Here are the options available:

  ```typescript
  // type ButtonOptions =
  {
    // Size of the button:
    size?: 'small' | 'medium' | 'large'

    // Corner style of the button:
    corners?: 'default' | 'pill'

    // Your own text for the button; default is "Log In with Audius":
    customText?: string

    // Whether to disable the button's "grow" animation on hover:
    disableHoverGrow?: boolean

    // Whether the button should take up the full width of its parent element:
    fullWidth?: boolean
  }
  ```

  Use [this playground](https://9ncjui.csb.app/) to see how these customizations affect the button appearance and determine what config works best for your app.

**Returns**: Nothing

### oauth.login()

opens the Log In with Audius popup, which begins the authentication flow

**Params**

None

**Returns**: Nothing

Example:

```js title="script.js"
function logInWithAudius() {
  audiusSdk.oauth.login();
}
```

```html title="index.html"
<button onclick="logInWithAudius()">Log In with Audius!</button>
```
