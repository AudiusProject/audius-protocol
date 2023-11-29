import Card from '../card/Card'

import CollectibleDetailsView from './CollectibleDetailsView'
import CollectibleGallery from './CollectibleGallery'
import CollectiblesHeader from './CollectiblesHeader'
import styles from './CollectiblesPlayerContainer.module.css'

const CollectiblesPlayerContainer = ({
  collectiblesInfo,
  flavor,
  isTwitter,
  backgroundColor
}) => {
  const getCollectiblesArray = () => {
    let output = []
    Object.values(collectiblesInfo.ethCollectibles).forEach(
      (colArr) => (output = output.concat(colArr))
    )
    Object.values(collectiblesInfo.solCollectibles).forEach(
      (colArr) => (output = output.concat(colArr))
    )
    return output
  }

  return (
    <>
      {collectiblesInfo.type === 'gallery' && (
        <CollectibleGallery
          collectibles={getCollectiblesArray()}
          flavor={flavor}
          user={collectiblesInfo.user}
          isTwitter={isTwitter}
          backgroundColor={backgroundColor}
        />
      )}
      {collectiblesInfo.type === 'detail' &&
        collectiblesInfo.collectible !== null && (
          <Card
            isTwitter={isTwitter}
            backgroundColor={backgroundColor}
            className={styles.card}
          >
            <CollectiblesHeader user={collectiblesInfo.user} />
            <CollectibleDetailsView
              collectible={collectiblesInfo.collectible}
              user={collectiblesInfo.user}
              isTwitter={isTwitter}
            />
          </Card>
        )}
      {collectiblesInfo.type === 'detail' &&
        collectiblesInfo.collectible === null && (
          <Card
            isTwitter={isTwitter}
            backgroundColor={backgroundColor}
            className={styles.card}
          >
            <CollectiblesHeader user={collectiblesInfo.user} />
            <p style={{ color: '#858199', textAlign: 'center' }}>
              Cannot find collectible.
            </p>
          </Card>
        )}
    </>
  )
}

export default CollectiblesPlayerContainer
