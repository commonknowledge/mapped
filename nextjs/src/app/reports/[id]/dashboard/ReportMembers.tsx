import { GenericData } from '@/__generated__/graphql'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { layerIdColour, selectedSourceMarkerAtom } from '@/lib/map'
import { gql, useApolloClient } from '@apollo/client'
import { useAtom } from 'jotai'
import useSWR from 'swr'
import { useReport } from '../(components)/ReportProvider'

interface ExtendedGenericData extends GenericData {
  sourceColour: string
  sourceId: string
}

export default function ReportDashboardMemberList() {
  const {
    report: { layers },
  } = useReport()

  const sourceIds = layers.map((layer) => layer.source.id)
  const {
    data: records,
    isLoading,
    error,
  } = useGenericDataByExternalDataSources(sourceIds)

  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Postcode</TableHead>
            <TableHead>Date Source</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Long/Lat</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records?.map((member: ExtendedGenericData) => (
            <TableRow
              key={member.id}
              className="relative font-mono font-normal text-xs cursor-pointer hover:bg-meepGray-600"
            >
              <TableCell className="text-meepGray-400">{member.id}</TableCell>
              <TableCell>{member.fullName}</TableCell>
              <TableCell>{member.postcode}</TableCell>

              <TableCell className="flex items-center gap-2">
                <div
                  style={{
                    backgroundColor: member.sourceColour,
                  }}
                  className="absolute left-0 top-0 w-2 h-full"
                />
                <div style={{ color: member.sourceColour }}>
                  {
                    layers.find((layer) => layer.source.id === member.sourceId)
                      ?.source.name
                  }
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.postcodeData?.longitude}</TableCell>
              <TableCell>{member.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function useGenericDataByExternalDataSources(sourceIds: string[]) {
  const client = useApolloClient()
  return useSWR(sourceIds, async (sourceIds: string[]) => {
    let array: ExtendedGenericData[] = []
    for (const sourceId of sourceIds) {
      const { data } = await client.query({
        query: gql`
          query ReportMembers($sourceId: String!) {
            genericDataByExternalDataSource(externalDataSourceId: $sourceId) {
              id
              data
              fullName
              email
              postcode

              publicUrl
              date
            }
          }
        `,
        variables: {
          sourceId,
        },
      })
      if (data?.genericDataByExternalDataSource) {
        array = [
          ...array,
          ...data?.genericDataByExternalDataSource.map((d: GenericData) => ({
            ...d,
            sourceId,
            sourceColour: layerIdColour(sourceId),
          })),
        ]
      }
    }
    return array
  })
}
