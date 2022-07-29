import { useState } from 'react'

import { Modal, Scrollbar } from '@audius/stems'
import cn from 'classnames'
import { each } from 'lodash'
import PropTypes from 'prop-types'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { connect } from 'react-redux'

import SearchBar from 'components/search-bar/SearchBar'

import styles from './ServiceSelectionModal.module.css'
import Service from './components/Service'
import {
  getShowModal,
  getServices,
  getPrimary,
  getSecondaries
} from './store/selectors'
import { setSelected, closeModal } from './store/slice'
import { getCountry } from './utils'

const PRIMARY_SERVICE_ID = 'primary-service'
const FIRST_SECONDARY_SERVICE_ID = 'first-secondary-service'
const ACTIVE_SERVICES_DROPPABLE_ID = 'active-services-droppable'
const AVAILABLE_SERVICES_DROPPABLE_ID = 'available-services-droppable'

const messages = {
  searchPlaceholder: 'Search Available Servers',
  searchTooltip: 'Search For Servers',
  headerText: 'Available Servers'
}

const DraggableService = (props) => {
  if (props.isSyncing || !props.draggable) return <Service {...props} />
  return (
    <Draggable key={props.name} draggableId={props.name} index={props.index}>
      {(provided, snapshot) => {
        return (
          <Service
            {...props}
            {...provided.draggableProps}
            handleProps={provided.dragHandleProps}
            forwardRef={provided.innerRef}
            dragging={snapshot.isDragging}
          />
        )
      }}
    </Draggable>
  )
}

const ServiceSelectionModal = ({
  primary,
  secondaries,
  services,
  setSelected,
  show,
  close
}) => {
  const [dragging, setDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openSearch, setOpenSearch] = useState(false)

  const onRemove = (service) => {
    let newPrimary = primary
    let newSecondaries = [...secondaries]
    if (service === primary) {
      newPrimary = secondaries[0]
      newSecondaries = [...secondaries.slice(1)]
    } else {
      const i = secondaries.indexOf(service)
      if (i > -1) newSecondaries.splice(i, 1)
    }
    setSelected(newPrimary, newSecondaries)
  }

  const onAdd = (service) => {
    const newSecondaries = secondaries.concat([service])
    setSelected(primary, newSecondaries)
  }

  const onDragStart = () => {
    setDragging(true)
  }

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result

    setDragging(false)

    if (source && destination && source.index !== destination.index) {
      if (
        destination.droppableId === AVAILABLE_SERVICES_DROPPABLE_ID &&
        secondaries.length > 0
      ) {
        onRemove(draggableId)
      } else {
        const selection = [primary, ...secondaries]

        const s = selection[source.index - 1]
        selection.splice(source.index - 1, 1)
        selection.splice(destination.index - 1, 0, s)
        const [newPrimary, ...newSecondaries] = selection
        if (destination.droppableId !== AVAILABLE_SERVICES_DROPPABLE_ID) {
          setSelected(newPrimary, newSecondaries)
        }
      }
    }
    const ss1 = document.getElementById(FIRST_SECONDARY_SERVICE_ID)
    if (ss1) ss1.classList.remove(styles.moveUpSection)
    const ps = document.getElementById(PRIMARY_SERVICE_ID)
    if (ps) ps.classList.remove(styles.moveDownSection)
  }

  const resetAddedDragClasses = () => {
    const ss1 = document.getElementById(FIRST_SECONDARY_SERVICE_ID)
    if (ss1) ss1.classList.remove(styles.moveUpSection)
    const ps = document.getElementById(PRIMARY_SERVICE_ID)
    if (ps) ps.classList.remove(styles.moveDownSection)
  }

  const onDragUpdate = (result) => {
    // Unfortunately, we can't do this by refs because react dnd needs that ref control.
    // This is a bit ugly, but you also can't add spacer elements between things in
    // react dnd that the elements will overflow around. And also you can't have two
    // separate droppables where elements flow between them. I think :-)
    const { source, destination } = result
    if (source && destination) {
      if (
        source.index === 1 &&
        (destination.index === 2 || destination.index === 3)
      ) {
        const ss1 = document.getElementById(FIRST_SECONDARY_SERVICE_ID)
        if (ss1) ss1.classList.add(styles.moveUpSection)
      } else if (
        (source.index === 2 || source.index === 3) &&
        destination.index === 1
      ) {
        const ps = document.getElementById(PRIMARY_SERVICE_ID)
        if (ps) ps.classList.add(styles.moveDownSection)
      } else {
        resetAddedDragClasses()
      }
    } else {
      resetAddedDragClasses()
    }
  }

  const onSearch = (query) => {
    setSearchQuery(query)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setOpenSearch(false)
  }

  const disabledAdd = primary && secondaries.length === 2

  const otherServices = []
  const secondariesSet = new Set(secondaries)
  each(services, (v, k) => {
    // Filter out primary/secondary and search no-matches.
    if (
      k !== primary &&
      !secondariesSet.has(k) &&
      (!searchQuery ||
        // Substring match
        k.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Substring match on country
        getCountry(v.country).toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      otherServices.push(
        <Service
          className={styles.service}
          key={k}
          name={k}
          country={v.country}
          onAdd={() => onAdd(k)}
          disabled={disabledAdd}
        />
      )
    }
  })

  const anySecondariesSyncing = secondaries.some((s) =>
    services[s] ? services[s].isSyncing : false
  )

  return (
    <Modal
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
      title={<div className={styles.title}>Change Servers (Advanced)</div>}
      showDismissButton
      showTitleHeader
      isOpen={show}
      onClose={close}
    >
      <Scrollbar className={styles.scrollable}>
        <DragDropContext
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        >
          <div className={styles.subtitle}>
            Pick the servers that host your Audius content.
          </div>
          <div className={styles.sections}>
            <Droppable droppableId={ACTIVE_SERVICES_DROPPABLE_ID}>
              {(provided, snapshot) => {
                return (
                  <div
                    className={cn(styles.droppableSections, {
                      [styles.dragging]: dragging
                    })}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {/* Primary */}
                    <div className={styles.section}>
                      <div className={styles.header}>
                        Primary Server (Select One)
                      </div>
                      <div
                        className={cn(styles.services, styles.primaryServices)}
                      >
                        <DraggableService
                          id={PRIMARY_SERVICE_ID}
                          className={cn(styles.service, styles.primary)}
                          name={primary}
                          country={services[primary].country}
                          isSyncing={services[primary].isSyncing}
                          onRemove={() => onRemove(primary)}
                          disabled={
                            secondaries.length === 0 || anySecondariesSyncing
                          }
                          draggable={
                            !services[primary].isSyncing &&
                            !anySecondariesSyncing
                          }
                          index={1}
                        />
                      </div>
                    </div>

                    <div className={styles.section}>
                      <div className={styles.header}>
                        Secondary Servers Server (Select Up To Two)
                      </div>
                      <div className={styles.services}>
                        {/* Secondaries */}
                        {secondaries.length === 0 && (
                          <Service
                            className={styles.service}
                            isEmpty
                            name='No Secondary Servers Selected'
                          />
                        )}
                        {secondaries[0] && (
                          <DraggableService
                            id={FIRST_SECONDARY_SERVICE_ID}
                            className={styles.service}
                            name={secondaries[0]}
                            country={services[secondaries[0]].country}
                            isSyncing={services[secondaries[0]].isSyncing}
                            onRemove={() => onRemove(secondaries[0])}
                            draggable={!services[secondaries[0]].isSyncing}
                            index={2}
                          />
                        )}
                        {secondaries[1] && (
                          <DraggableService
                            className={styles.service}
                            name={secondaries[1]}
                            country={services[secondaries[1]].country}
                            isSyncing={services[secondaries[1]].isSyncing}
                            onRemove={() => onRemove(secondaries[1])}
                            draggable={!services[secondaries[1]].isSyncing}
                            index={3}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              }}
            </Droppable>

            {/* Available */}
            <Droppable droppableId={AVAILABLE_SERVICES_DROPPABLE_ID}>
              {(provided, snapshot) => {
                return (
                  <div
                    className={cn(styles.section, styles.available)}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <SearchBar
                      className={styles.searchBar}
                      iconClassname={styles.searchIcon}
                      open={openSearch}
                      onOpen={() => setOpenSearch(true)}
                      onClose={() => setOpenSearch(false)}
                      value={searchQuery}
                      onSearch={onSearch}
                      placeholder={messages.searchPlaceholder}
                      tooltipText={messages.searchTooltip}
                      headerText={messages.headerText}
                    />
                    <div className={styles.services}>
                      {otherServices.length > 0 && otherServices}
                    </div>
                    <div className={styles.bottomText}>
                      {otherServices.length === 0 && searchQuery && (
                        <div className={styles.noMatch}>
                          No Servers Matched Your Search.
                        </div>
                      )}
                      {otherServices.length === 0 && !searchQuery && (
                        <div className={styles.noMatch}>
                          No Available Servers.
                        </div>
                      )}
                      {searchQuery !== '' && (
                        <div
                          className={styles.clearSearch}
                          onClick={clearSearch}
                        >
                          <div>Clear Search</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }}
            </Droppable>
          </div>
        </DragDropContext>
      </Scrollbar>
    </Modal>
  )
}

ServiceSelectionModal.propTypes = {
  services: PropTypes.object,
  primary: PropTypes.string,
  secondaries: PropTypes.arrayOf(PropTypes.string),
  onUpdateSelection: PropTypes.func
}

ServiceSelectionModal.defaultProps = {}

const mapStateToProps = (state) => ({
  show: getShowModal(state),
  services: getServices(state),
  primary: getPrimary(state),
  secondaries: getSecondaries(state)
})

const mapDispatchToProps = (dispatch) => ({
  setSelected: (primary, secondaries) =>
    dispatch(setSelected({ primary, secondaries })),
  close: () => dispatch(closeModal())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ServiceSelectionModal)
