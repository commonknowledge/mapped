'use client'

import { QueryResult } from '@apollo/client'
import { createContext, useContext } from 'react'

import {
  AnalyticalAreaType,
  Exact,
  GetMapReportQuery,
  MapReportInput,
} from '@/__generated__/graphql'

export const defaultDisplayOptions = {
  showLastElectionData: false,
  showMPs: false,
  showStreetDetails: false,
  analyticalAreaType: AnalyticalAreaType.ParliamentaryConstituency_2024,
}

export type DisplayOptionsType = typeof defaultDisplayOptions & {}

export const reportContext = createContext<{
  id: string
  updateReport: (data: MapReportInput) => void
  deleteReport: () => void
  report?: QueryResult<GetMapReportQuery, Exact<{ id: string }>>
  refreshReportDataQueries: () => void
  displayOptions: DisplayOptionsType
  setDisplayOptions: (options: Partial<DisplayOptionsType>) => void
}>({
  id: '?',
  updateReport: () => ({}) as any,
  deleteReport: () => {},
  refreshReportDataQueries: () => {},
  displayOptions: defaultDisplayOptions,
  setDisplayOptions: () => {},
})

export const useReportContext = () => {
  const context = useContext(reportContext)
  const { displayOptions, setDisplayOptions } = context

  const updateDisplayOptions = (options: Partial<DisplayOptionsType>) => {
    setDisplayOptions({ ...displayOptions, ...options })
  }

  return { ...context, updateDisplayOptions }
}
