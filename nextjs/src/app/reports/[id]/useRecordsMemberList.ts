import { useState } from 'react'
import { useReport } from './(components)/ReportProvider'

export default function useRecordsMemberList() {
  const report = useReport()
  const memberLayers = report.report.layers
  const [members, setMembers] = useState<any[]>([])

  return members
}
