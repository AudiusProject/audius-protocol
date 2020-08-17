import PropTypes from 'prop-types'

export const CompletionStage = PropTypes.shape({
  title: PropTypes.string.isRequired,
  isCompleted: PropTypes.bool.isRequired
})

export const CompletionStageArray = PropTypes.arrayOf(CompletionStage)
