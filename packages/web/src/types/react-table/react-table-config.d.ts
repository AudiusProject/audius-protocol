import {
  // ### Column Order
  // UseColumnOrderInstanceProps,
  // UseColumnOrderState,
  // ### Expanded
  // UseExpandedHooks,
  // UseExpandedInstanceProps,
  // UseExpandedOptions,
  // UseExpandedRowProps,
  // UseExpandedState,
  // - Filters
  // UseFiltersColumnOptions,
  // UseFiltersColumnProps,
  // UseFiltersInstanceProps,
  // UseFiltersOptions,
  // UseFiltersState,
  // ### Global Filters
  // UseGlobalFiltersColumnOptions,
  // UseGlobalFiltersInstanceProps,
  // UseGlobalFiltersOptions,
  // UseGlobalFiltersState,
  // ### Group By
  // UseGroupByCellProps,
  // UseGroupByColumnOptions,
  // UseGroupByColumnProps,
  // UseGroupByHooks,
  // UseGroupByInstanceProps,
  // UseGroupByOptions,
  // UseGroupByRowProps,
  // UseGroupByState,
  // ### Pagination
  // UsePaginationInstanceProps,
  // UsePaginationOptions,
  // UsePaginationState,
  // ### ResizeColumns
  UseResizeColumnsColumnOptions,
  UseResizeColumnsColumnProps,
  UseResizeColumnsOptions,
  UseResizeColumnsState,
  // ### RowSelect
  // UseRowSelectHooks,
  // UseRowSelectInstanceProps,
  // UseRowSelectOptions,
  // UseRowSelectRowProps,
  // UseRowSelectState,
  // ### Row State
  // UseRowStateCellProps,
  // UseRowStateInstanceProps,
  // UseRowStateOptions,
  // UseRowStateRowProps,
  // UseRowStateState,
  // ### Sort By
  UseSortByColumnOptions,
  UseSortByColumnProps,
  UseSortByHooks,
  UseSortByInstanceProps,
  UseSortByOptions,
  UseSortByState
} from 'react-table'

declare module 'react-table' {
  // take this file as-is, or comment out the sections that don't apply to your plugin configuration

  export interface TableOptions<D extends Record<string, unknown>>
    extends UseResizeColumnsOptions<D>,
      UseSortByOptions<D>,
      // note that having Record here allows you to add anything to the options, this matches the spirit of the
      // underlying js library, but might be cleaner if it's replaced by a more specific type that matches your
      // feature set, this is a safe default.
      Record<string, any> {}
  // UseFiltersOptions<D>,
  // UseGlobalFiltersOptions<D>,
  // UseExpandedOptions<D>,
  // UseGroupByOptions<D>,
  // UsePaginationOptions<D>,
  // UseRowSelectOptions<D>,
  // UseRowStateOptions<D>,

  export interface Hooks<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseSortByHooks<D> {}
  // UseExpandedHooks<D>,
  // UseGroupByHooks<D>,
  // UseRowSelectHooks<D> {}

  export interface TableInstance<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseSortByInstanceProps<D> {}
  // UseFiltersInstanceProps<D>,
  // UseGlobalFiltersInstanceProps<D>,
  // UseColumnOrderInstanceProps<D>,
  // UseExpandedInstanceProps<D>,
  // UseGroupByInstanceProps<D>,
  // UsePaginationInstanceProps<D>,
  // UseRowSelectInstanceProps<D>,
  // UseRowStateInstanceProps<D>,

  export interface TableState<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseResizeColumnsState<D>,
      UseSortByState<D> {}
  // UseColumnOrderState<D>,
  // UseExpandedState<D>,
  // UseFiltersState<D>,
  // UseGlobalFiltersState<D>,
  // UseGroupByState<D>,
  // UsePaginationState<D>,
  // UseRowSelectState<D>,
  // UseRowStateState<D>,

  interface CustomColumn {
    align?: 'right' | 'left'
    accessor?: string
    sortTitle?: string
  }

  export interface ColumnInterface<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseSortByColumnOptions<D>,
      UseResizeColumnsColumnOptions<D>,
      CustomColumn {}
  // UseFiltersColumnOptions<D>,
  // UseGlobalFiltersColumnOptions<D>,
  // UseGroupByColumnOptions<D>,

  export interface ColumnInstance<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseResizeColumnsColumnProps<D>,
      UseSortByColumnProps<D>,
      CustomColumn {}
  // UseFiltersColumnProps<D>,
  // UseGroupByColumnProps<D>,

  export interface Cell<
    // D extends Record<string, unknown> = Record<string, unknown>,
    // V = any
  > {}
  // UseRowStateCellProps<D>,
  // UseGroupByCellProps<D> {}

  export interface Row<
    // D extends Record<string, unknown> = Record<string, unknown>
  > {}
  // UseRowSelectRowProps<D>,
  // UseRowStateRowProps<D>,
  // UseExpandedRowProps<D>,
  // UseGroupByRowProps<D> {}
}
