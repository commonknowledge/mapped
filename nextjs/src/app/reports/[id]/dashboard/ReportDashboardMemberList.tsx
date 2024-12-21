import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

const dummyData = [
  {
    name: 'John Doe',
    postcode: 'AB12 3CD',
    email: 'john.doe@example.com',
    phone: '07777 777777',
    dateSource: 'Source',
    dateCreated: '2024-01-01',
    dateUpdated: '2024-01-01',
    notes: 'Notes',
  },
  {
    name: 'Jane Doe',
    postcode: 'AB12 3CD',
    email: 'jane.doe@example.com',
    phone: '07777 777777',
    dateSource: 'Source',
    dateCreated: '2024-01-01',
    dateUpdated: '2024-01-01',
    notes: 'Notes',
  },
  {
    name: 'John Doe',
    postcode: 'AB12 3CD',
    email: 'john.doe@example.com',
    phone: '07777 777777',
    dateSource: 'Source',
    dateCreated: '2024-01-01',
    dateUpdated: '2024-01-01',
    notes: 'Notes',
  },
  {
    name: 'John Doe',
    postcode: 'AB12 3CD',
    email: 'john.doe@example.com',
    phone: '07777 777777',
    dateSource: 'Source',
    dateCreated: '2024-01-01',
    dateUpdated: '2024-01-01',
    notes: 'Notes',
  },
]

export default function ReportDashboardMemberList() {
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Member</TableCell>
          <TableCell>Postcode</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>DateSource</TableCell>
          <TableCell>DateCreated</TableCell>
          <TableCell>DateUpdated</TableCell>
          <TableCell>Notes</TableCell>
        </TableRow>
        {dummyData.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.postcode}</TableCell>
            <TableCell>{item.email}</TableCell>
            <TableCell>{item.phone}</TableCell>
            <TableCell>{item.dateSource}</TableCell>
            <TableCell>{item.dateCreated}</TableCell>
            <TableCell>{item.dateUpdated}</TableCell>
            <TableCell>{item.notes}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
