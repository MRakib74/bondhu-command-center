"use client"

import { useState } from "react"
import { Search, Download, Upload, Filter, MoreHorizontal, X, FileSpreadsheet } from "lucide-react"

// Extended mock data based on user requirements
const initialCustomers = [
  { id: 1, name: "Rakib Raja", phone: "01819XXXXXX", email: "rakib@example.com", district: "Dhaka", thana: "Mirpur", address: "Mirpur 10", product: "AI Course", orderId: "ORD-101", deliveryCharge: 60, totalOrders: 5, totalSpent: 12500, status: "Delivered 🟢" },
  { id: 2, name: "Tanvir Ahmed", phone: "01712XXXXXX", email: "tanvir@example.com", district: "Chattogram", thana: "Panchlaish", address: "O.R. Nizam Road", product: "Web Dev Course", orderId: "ORD-102", deliveryCharge: 100, totalOrders: 1, totalSpent: 1200, status: "Pending 🟡" },
  { id: 3, name: "Sajid Hasan", phone: "01614XXXXXX", email: "", district: "Sylhet", thana: "Zindabazar", address: "Zindabazar Road", product: "SEO Mastery", orderId: "ORD-103", deliveryCharge: 120, totalOrders: 2, totalSpent: 3400, status: "Returned 🟣" },
  { id: 4, name: "Mehedi", phone: "01915XXXXXX", email: "", district: "", thana: "", address: "", product: "", orderId: "", deliveryCharge: 0, totalOrders: 0, totalSpent: 0, status: "Raw Leads 📱" },
]

const TABS = ['All', 'Pending 🟡', 'Confirmed 🔵', 'Delivered 🟢', 'Returned 🟣', 'Hold 🟠', 'Cancelled 🔴', 'Raw Leads 📱']

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [customers, setCustomers] = useState(initialCustomers)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter customers based on active tab and search query
  const filteredCustomers = customers.filter(c => {
    const matchesTab = activeTab === 'All' || c.status === activeTab
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery) || 
                          c.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers & CRM</h2>
          <p className="text-muted-foreground mt-2">Manage all your leads, active customers, and AI segmentations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col gap-4 bg-secondary/20">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or order ID..." 
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl hover:bg-secondary transition-colors text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filter Custom Columns
            </button>
          </div>

          {/* Dynamic Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background border border-border hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Info</th>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium">Delivery</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No records found in "{activeTab}" segment.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/20 transition-colors group whitespace-nowrap">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{customer.name || "Unknown"}</div>
                      <div className="text-muted-foreground text-xs">{customer.phone}</div>
                      {customer.email && <div className="text-muted-foreground text-xs">{customer.email}</div>}
                    </td>
                    <td className="px-6 py-4 font-medium">{customer.orderId || "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{customer.product || "-"}</td>
                    <td className="px-6 py-4">
                      {customer.district ? (
                        <>
                          <div className="text-foreground">{customer.district}, {customer.thana}</div>
                          <div className="text-muted-foreground text-xs truncate max-w-[150px]">{customer.address}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {customer.deliveryCharge ? `৳ ${customer.deliveryCharge}` : "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-primary">
                      {customer.totalSpent ? `৳ ${customer.totalSpent.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        customer.status.includes('Delivered') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        customer.status.includes('Returned') || customer.status.includes('Cancelled') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        customer.status.includes('Pending') || customer.status.includes('Hold') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-secondary/10 mt-auto">
          <div>Showing {filteredCustomers.length} of {customers.length} entries</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Upload CSV Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Import Custom Data (CSV)</h3>
                <p className="text-sm text-muted-foreground mt-1">Upload records directly into a specific segment.</p>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Target Segment Selector */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Select Target Segment</label>
                <select className="w-full bg-zinc-900 text-white border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">-- Choose where to save these records --</option>
                  <option value="Pending 🟡">Pending 🟡</option>
                  <option value="Hold 🟠">Hold 🟠</option>
                  <option value="Confirmed 🔵">Confirmed 🔵</option>
                  <option value="Delivered 🟢">Delivered 🟢</option>
                  <option value="Returned 🟣">Returned 🟣</option>
                  <option value="Cancelled 🔴">Cancelled 🔴</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Records in the CSV will be automatically saved under this segment.
                </p>
              </div>

              {/* Drag & Drop Area */}
              <div 
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-800 transition-colors cursor-pointer group relative"
              >
                <input 
                  type="file" 
                  accept=".csv, .xlsx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      alert(`File selected: ${e.target.files[0].name}. Backend processing will be implemented next!`);
                    }
                  }}
                />
                <div className="p-4 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold mb-1 text-white">Click or drag CSV file to upload</h4>
                <p className="text-sm text-muted-foreground">Supported format: .csv, .xlsx</p>
              </div>
              
              {/* Smart Automation Toggle */}
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <input type="checkbox" id="auto-parse" className="rounded bg-background border-border text-primary focus:ring-primary h-4 w-4" defaultChecked />
                <label htmlFor="auto-parse" className="text-sm">
                  <span className="font-medium block text-primary">Auto-parse Address (AI)</span>
                  <span className="text-muted-foreground text-xs">Automatically extract District & Thana from address column.</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/20 flex justify-end gap-3">
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-border hover:bg-secondary rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors opacity-50 cursor-not-allowed">
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
