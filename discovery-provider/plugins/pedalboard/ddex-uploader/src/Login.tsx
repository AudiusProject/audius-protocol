import { useEffect, useRef } from "react";
import { audiusSdk } from "./audiusSdk"
import { State, appStore } from "./store";

export const Login = () => {
    const buttonDivRef = useRef(null);
    const setUser = appStore((state) => state.setUser)
    const user = appStore((state) => state.user)
    const toState = appStore((state) => state.toState)

    async function loadOauth() {
        audiusSdk.oauth?.init({
          successCallback: setUser,
          errorCallback: console.error
        });
        audiusSdk.oauth?.renderButton({
          // @ts-ignore
          element: buttonDivRef.current,
          scope: "write"
        });
      }
    
      useEffect(() => {
        loadOauth();
      }, []);

      // once this page is done, move to next
      if (user) toState(State.Ingest)

    return <div>
        <>
          <div className="centered">
            <div ref={buttonDivRef} />
          </div>
        </>
    </div>
}
