import { Search, Download, Upload, Filter, MoreHorizontal } from "lucide-react"

const mockCustomers = [
  { id: 1, name: "Rakib Raja", phone: "01819XXXXXX", district: "Dhaka", totalOrders: 5, totalSpent: 12500, status: "High Value" },
  { id: 2, name: "Tanvir Ahmed", phone: "01712XXXXXX", district: "Chattogram", totalOrders: 1, totalSpent: 1200, status: "Pending" },
  { id: 3, name: "Sajid Hasan", phone: "01614XXXXXX", district: "Sylhet", totalOrders: 2, totalSpent: 3400, status: "Returned" },
  { id: 4, name: "Mehedi", phone: "01915XXXXXX", district: "Rajshahi", totalOrders: 0, totalSpent: 0, status: "Lead" },
]

export default function CustomersPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers & CRM</h2>
          <p className="text-muted-foreground mt-2">Manage all your leads, active customers, and AI segmentations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors">
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-secondary/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl hover:bg-secondary transition-colors text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filter Segments
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Name</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">District</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Total Spent</th>
                <th className="px-6 py-4 font-medium">AI Label</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground">{customer.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{customer.phone}</td>
                  <td className="px-6 py-4 text-muted-foreground">{customer.district}</td>
                  <td className="px-6 py-4 text-muted-foreground">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-muted-foreground">৳ {customer.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      customer.status === 'High Value' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      customer.status === 'Returned' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      customer.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-secondary/10">
          <div>Showing 1 to 4 of 1,632 entries</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
