import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useColorMode } from '@docusaurus/theme-common'
import styles from "./index.module.css";
import { theme as dark } from "../theme/dark";
import { theme as light } from "../theme/light";

const applyTheme = (themeObject) => {
  Object.keys(themeObject).forEach((key) => {
    document.documentElement.style.setProperty(key, themeObject[key]);
  });
};

const Main = () => {
  const { colorMode } = useColorMode();
  const isDarkTheme = colorMode === 'dark'
  const [initialThemeIsDark, setInitialThemeIsDark] = useState(null);
  useEffect(() => {
    if (initialThemeIsDark) {
      if (isDarkTheme) {
        // switch to dark

        applyTheme(dark);
      } else {
        // switch to light
        applyTheme(light);
      }
    } else {
      setInitialThemeIsDark(isDarkTheme);
    }
  }, [isDarkTheme, initialThemeIsDark]);

  return (
    <main>
      <section className={styles.features}>
        <div className="container">
          <div className="row cards__container">
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="protocol/overview">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="overview">🗺 Overview</Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="get-an-overview">
                        Get an overview of what Audius is, how it works, and how
                        you can contribute
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="developers/rest-api">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="api-reference">🎶 API</Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="rest-api">
                        Query, stream, and search Artists, Tracks, and Playlists
                        from your own app, game, or project
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="developers/sdk">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="sdk-reference">🧳 SDK</Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="sdk">
                        Easily build on and interact with the Audius protocol
                        using the Audius JavaScript SDK
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="developers/log-in-with-audius">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="oauth-reference">
                        🔑 Log In with Audius
                      </Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="oauth">
                        Authenticate users using their Audius profile
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="token/audio">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="audio">🎧 $AUDIO</Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="learn-about-the-token">
                        Learn about the $AUDIO Token and how it keeps the
                        network secure & operational
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="token/staking">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="staking">
                        🔓 Staking The Network
                      </Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="staking-and-delegating">
                        Stake & delegate the $AUDIO token, earn rewards, and
                        participate in Governance
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link
                className="navbar__link"
                to="token/running-a-node/introduction"
              >
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="run-validator">
                        🛠 Run A Node
                      </Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="serve-traffic">
                        Get up and running and serve traffic for the Audius
                        network
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className={clsx("col col--4", styles.feature)}>
              <Link className="navbar__link" to="token/governance">
                <div className="card">
                  <div className="card__header">
                    <h3>
                      <Translate description="governance">
                        ⚖️ Governance
                      </Translate>
                    </h3>
                  </div>
                  <div className="card__body">
                    <p>
                      <Translate description="">
                        Voice your vote. Learn how on-chain governance works and
                        how to get involved
                      </Translate>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

const Index = () => {
  const context = useDocusaurusContext();

  const { siteConfig = {} } = context;
  return (
    <Layout title="Home" description="Audius Docs">
      <Main />
    </Layout>
  );
};

export default Index;
