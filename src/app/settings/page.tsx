import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground mt-2">Manage API keys and system configurations.</p>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Settings className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">System Settings</h3>
        <p className="text-muted-foreground max-w-md">
          Settings dashboard for WhatsApp instances, API Webhooks, and User Management will be available here.
        </p>
      </div>
    </div>
  )
}
