import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquareIcon } from 'lucide-react'

export default function ReportDashboardChat() {
  return (
    <div className="p-4 px-8 items-center justify-center flex flex-col gap-4 w-full h-[calc(100vh-120px)]">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="w-6 h-6 text-brandBlue" />
        <h1 className="text-lg">Ask AI about your Data</h1>
      </div>
      <div className="w-full flex flex-col gap-2">
        <Textarea placeholder="Ask a question" />
        <Button>Send</Button>
      </div>
    </div>
  )
}
