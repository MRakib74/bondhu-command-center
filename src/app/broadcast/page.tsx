import { Send } from "lucide-react"

export default function BroadcastPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Broadcast</h2>
          <p className="text-muted-foreground mt-2">Send bulk AI-generated promotional messages via WhatsApp.</p>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Send className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Broadcast module under construction</h3>
        <p className="text-muted-foreground max-w-md">
          This feature will allow you to select customer segments and have AI generate tailored promotional messages for them.
        </p>
      </div>
    </div>
  )
}
