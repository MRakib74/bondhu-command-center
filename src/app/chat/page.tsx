import { MessageSquare } from "lucide-react"

export default function ChatPage() {
  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live AI Chat</h2>
          <p className="text-muted-foreground mt-2">Monitor AI conversations with your customers in real-time.</p>
        </div>
      </div>
      
      <div className="glass-card rounded-2xl flex-1 flex overflow-hidden min-h-[500px]">
        {/* Chat List */}
        <div className="w-1/3 border-r border-border bg-secondary/10 flex flex-col items-center justify-center p-6 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Waiting for incoming messages...</p>
        </div>
        
        {/* Chat Window */}
        <div className="flex-1 flex flex-col items-center justify-center bg-background/50 text-center p-8">
           <h3 className="text-xl font-semibold mb-2">No active chat selected</h3>
           <p className="text-muted-foreground">When the Evolution API starts receiving WhatsApp messages, they will appear here along with the AI's response.</p>
        </div>
      </div>
    </div>
  )
}
