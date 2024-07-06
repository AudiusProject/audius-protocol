import { FieldArray, useField } from 'formik'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

import { CollectionTrackForUpload } from 'pages/upload-page/types'

import { CollectionTrackField } from './CollectionTrackField'

const messages = {
  trackList: 'Track List'
}

export const CollectionTrackFieldArray = () => {
  const [{ value: tracks }] = useField<CollectionTrackForUpload[]>('tracks')

  return (
    <FieldArray name='tracks'>
      {({ move, remove }) => (
        <DragDropContext
          onDragEnd={(result) => {
            if (!result.destination) {
              return
            }
            move(result.source.index, result.destination.index)
          }}
        >
          <Droppable droppableId='tracks'>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                role='list'
                aria-label={messages.trackList}
              >
                {tracks.map((track, index) => {
                  const id =
                    track.metadata.track_id ?? `${track.file?.name}--${index}`

                  return (
                    <Draggable key={id} draggableId={String(id)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          role='listitem'
                        >
                          <CollectionTrackField
                            index={index}
                            remove={remove}
                            disableDelete={tracks.length === 1}
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </FieldArray>
  )
}
