import { FieldArray, useField } from 'formik'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

import { CollectionTrackForUpload } from '../types'

import { CollectionTrackField } from './CollectionTrackField'

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
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {tracks.map((track, index) => (
                  <Draggable
                    key={track.file.name}
                    draggableId={track.file.name ?? ''}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <CollectionTrackField
                          index={index}
                          remove={remove}
                          disableDelete={tracks.length === 1}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </FieldArray>
  )
}
