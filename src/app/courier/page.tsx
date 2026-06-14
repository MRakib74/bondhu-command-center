import { Truck } from "lucide-react"

export default function CourierPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courier Auto-Entry</h2>
          <p className="text-muted-foreground mt-2">Automatically send your orders to Pathao, Steadfast, and RedX.</p>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Truck className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Courier API Setup Pending</h3>
        <p className="text-muted-foreground max-w-md">
          Please add your Steadfast/Pathao API keys in the settings to activate the auto-entry system.
        </p>
      </div>
    </div>
  )
}
