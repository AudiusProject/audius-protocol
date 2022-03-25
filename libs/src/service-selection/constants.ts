export enum DECISION_TREE_STATE {
  CHECK_SHORT_CIRCUIT = 'Check Short Circuit',
  GET_ALL_SERVICES = 'Get All Services',
  FILTER_TO_WHITELIST = 'Filter To Whitelist',
  FILTER_FROM_BLACKLIST = 'Filter From Blacklist',
  FILTER_OUT_KNOWN_UNHEALTHY = 'Filter Out Known Unhealthy',
  GET_SELECTION_ROUND = 'Get Selection Round',
  NO_SERVICES_LEFT_TO_TRY = 'No Services Left To Try',
  SELECTED_FROM_BACKUP = 'Selected From Backup',
  FAILED_AND_RESETTING = 'Failed Everything -- Resetting',
  ROUND_FAILED_RETRY = 'Round Failed Retry',
  MADE_A_SELECTION = 'Made A Selection',
  RACED_AND_FOUND_BEST = 'Raced And Found Best'
}
