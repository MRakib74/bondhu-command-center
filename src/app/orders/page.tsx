import { ShoppingCart } from "lucide-react"

export default function OrdersPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground mt-2">View and manage all orders synced from Bondhumart.</p>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <ShoppingCart className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Syncing Orders...</h3>
        <p className="text-muted-foreground max-w-md">
          Orders will automatically appear here once the Webhook connection is fully established with your main Laravel website.
        </p>
      </div>
    </div>
  )
}
