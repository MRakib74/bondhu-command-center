"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ShoppingCart, Search, Download, Trash2, CheckCircle, Truck, RefreshCw, Loader2, Send, Plus, Edit, X, Eye, Package, Clock, MapPin, Phone, User, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Order {
  id: string
  bondhumartId: string | null
  customer: { id: string, name: string, phone: string, address?: string, district?: string }
  product: { id: string, name: string }
  quantity: number
  status: string
  amount: number
  deliveryCharge: number
  courierName?: string
  courierTracking?: string
  createdAt: string
  deliveredAt?: string
}

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'on-hold', label: 'On Hold' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returning', label: 'Returning' },
  { id: 'return-received', label: 'Return Received' },
  { id: 'incomplete', label: 'Incomplete' },
]

const STATUS_FLOW = ['Pending', 'Confirmed', 'Shipped', 'Delivered']

export default function OrderManagePage() {
  const params = useParams()
  const router = useRouter()
  const currentTab = typeof params.status === 'string' ? params.status : 'all'

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // New Order Modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [newForm, setNewForm] = useState({ customerName: '', phone: '', address: '', district: '', product: '', quantity: '1', amount: '', deliveryCharge: '0', status: 'Pending' })

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({ customerName: '', phone: '', address: '', district: '', product: '', quantity: '1', amount: '', deliveryCharge: '0' })

  // Details / Tracking Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [currentTab])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/website-management/orders?status=${currentTab}`)
      const data = await res.json()
      if (Array.isArray(data)) setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filtered.map(o => o.id))
    else setSelectedIds([])
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!')
    if (!confirm(`${selectedIds.length}টি অর্ডারের স্ট্যাটাস "${newStatus}" করতে চান?`)) return

    setIsProcessing(true)
    try {
      const res = await fetch('/api/website-management/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedIds, status: newStatus, action: 'status_change' })
      })
      if (res.ok) {
        setSelectedIds([])
        fetchOrders()
      } else {
        alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে')
      }
    } catch (e) {
      alert('নেটওয়ার্ক এরর')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDispatch = async () => {
    if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!');
    
    // Read courier config
    let configData;
    try {
      configData = JSON.parse(localStorage.getItem('bondhu_courier_config') || '{}');
    } catch (e) {}

    if (!configData || !configData.defaultCourier) {
      alert("দয়া করে Courier Auto-Entry পেজ থেকে কুরিয়ার এপিআই সেটআপ করুন।");
      return;
    }

    const courierId = configData.defaultCourier;
    const courierObj = configData.couriers?.find((c: any) => c.id === courierId);
    
    if (!courierObj || !courierObj.apiKey) {
      alert(`${courierObj?.name || courierId} এর API Key সেট করা নেই!`);
      return;
    }

    // Get selected order details
    const ordersToDispatch = orders.filter(o => selectedIds.includes(o.id));
    
    // Map them for the proxy API (passing dbId to ensure we know which one succeeded)
    const payloadOrders = ordersToDispatch.map(o => ({
      id: o.bondhumartId || o.id,
      dbId: o.id,
      customerName: o.customer?.name,
      phone: o.customer?.phone,
      address: o.customer?.address,
      district: o.customer?.district,
      amount: o.amount,
      deliveryCharge: o.deliveryCharge,
      product: o.product?.name,
      quantity: o.quantity
    }));

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/courier/${courierId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: courierObj.apiKey,
          secretKey: courierObj.secretKey,
          baseUrl: courierObj.baseUrl,
          orders: payloadOrders
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.processed > 0) {
          alert(`✅ ${data.processed} টি অর্ডার সফলভাবে কুরিয়ারে পাঠানো হয়েছে!`);
          
          // Only update the status for orders that ACTUALLY succeeded
          const successfulDbIds = data.results.map((r: any) => r.orderId);
          
          if (successfulDbIds.length > 0) {
            await fetch('/api/website-management/orders', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'status_change', orderIds: successfulDbIds, status: 'Shipped' })
            });
          }
        }
        
        if (data.failed > 0) {
          const firstError = data.errors && data.errors.length > 0 ? data.errors[0].error : 'অজানা ত্রুটি';
          alert(`❌ ${data.failed} টি অর্ডার কুরিয়ারে পাঠানো যায়নি।\nকারণ: ${firstError}`);
        }
        
        fetchOrders();
        setSelectedIds([]);
      } else {
        alert(`❌ এরর: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (e) {
      alert('নেটওয়ার্ক এরর বা API কল ফেইল করেছে');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDelete = async () => {
    if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!')
    if (!confirm(`${selectedIds.length}টি অর্ডার ডিলিট করতে চান?`)) return

    setIsProcessing(true)
    try {
      const res = await fetch('/api/website-management/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedIds })
      })
      if (res.ok) {
        setSelectedIds([])
        fetchOrders()
      }
    } catch (e) {
      alert('নেটওয়ার্ক এরর')
    } finally {
      setIsProcessing(false)
    }
  }

  // New Order
  const handleCreateOrder = async () => {
    if (!newForm.customerName || !newForm.phone) return alert('কাস্টমারের নাম এবং ফোন নম্বর দিন!')
    setIsProcessing(true)
    try {
      const res = await fetch('/api/website-management/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      })
      if (res.ok) {
        setShowNewModal(false)
        setNewForm({ customerName: '', phone: '', address: '', district: '', product: '', quantity: '1', amount: '', deliveryCharge: '0', status: 'Pending' })
        fetchOrders()
        alert('✅ নতুন অর্ডার সফলভাবে তৈরি হয়েছে!')
      } else {
        alert('অর্ডার তৈরি করতে সমস্যা হয়েছে')
      }
    } catch (e) {
      alert('নেটওয়ার্ক এরর')
    } finally {
      setIsProcessing(false)
    }
  }

  // Edit Order
  const openEditModal = (order: Order) => {
    setEditOrder(order)
    setEditForm({
      customerName: order.customer?.name || '',
      phone: order.customer?.phone || '',
      address: order.customer?.address || '',
      district: order.customer?.district || '',
      product: order.product?.name || '',
      quantity: String(order.quantity || 1),
      amount: String(order.amount || 0),
      deliveryCharge: String(order.deliveryCharge || 0)
    })
    setShowEditModal(true)
  }

  const handleEditOrder = async () => {
    if (!editOrder) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/website-management/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_single', orderId: editOrder.id, ...editForm })
      })
      if (res.ok) {
        setShowEditModal(false)
        fetchOrders()
        alert('✅ অর্ডার আপডেট হয়েছে!')
      } else {
        alert('আপডেট করতে সমস্যা হয়েছে')
      }
    } catch (e) {
      alert('নেটওয়ার্ক এরর')
    } finally {
      setIsProcessing(false)
    }
  }

  // View Details / Tracking
  const openDetailsModal = (order: Order) => {
    setDetailsOrder(order)
    setShowDetailsModal(true)
  }

  const getStatusStep = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'pending') return 0
    if (s === 'confirmed') return 1
    if (s === 'shipped') return 2
    if (s === 'delivered') return 3
    return -1 // cancelled, returning, etc.
  }

  // CSV Download
  const downloadCSV = () => {
    if (filtered.length === 0) return alert('ডাউনলোড করার মতো কোনো অর্ডার নেই')
    const headers = ['Invoice', 'Customer', 'Phone', 'Address', 'Product', 'Qty', 'Amount', 'Delivery', 'Status', 'Date']
    const rows = filtered.map(o => [
      o.bondhumartId || o.id.slice(-6),
      o.customer?.name || '',
      o.customer?.phone || '',
      o.customer?.address || '',
      o.product?.name || '',
      o.quantity || 1,
      o.amount,
      o.deliveryCharge || 0,
      o.status,
      new Date(o.createdAt).toLocaleDateString('en-GB')
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${currentTab}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const filtered = orders.filter(o => 
    o.customer?.phone?.includes(search) || 
    o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.bondhumartId?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10'
      case 'confirmed': return 'text-blue-400 border-blue-400/20 bg-blue-400/10'
      case 'shipped': return 'text-orange-400 border-orange-400/20 bg-orange-400/10'
      case 'delivered': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
      case 'cancelled': return 'text-red-500 border-red-500/20 bg-red-500/10'
      case 'on hold': return 'text-purple-400 border-purple-400/20 bg-purple-400/10'
      case 'returning': return 'text-pink-400 border-pink-400/20 bg-pink-400/10'
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-800/50'
    }
  }

  // Stats
  const totalAmount = filtered.reduce((s, o) => s + (o.amount || 0), 0)
  const totalDelivery = filtered.reduce((s, o) => s + (o.deliveryCharge || 0), 0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto text-zinc-100 bg-[#0a0a0a] min-h-screen">
      
      {/* Top Tabs Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex overflow-x-auto hide-scrollbar snap-x">
        {TABS.map(tab => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => router.push(`/website-management/orders/${tab.id}`)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all snap-start",
                isActive 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase font-medium">মোট অর্ডার</div>
          <div className="text-2xl font-bold text-white mt-1">{filtered.length}</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase font-medium">মোট বিক্রি</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">৳{totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase font-medium">ডেলিভারি চার্জ</div>
          <div className="text-2xl font-bold text-orange-400 mt-1">৳{totalDelivery.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase font-medium">সিলেক্টেড</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{selectedIds.length}</div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        
        {/* Action Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <button 
              onClick={() => setShowNewModal(true)}
              className="bg-emerald-500 text-black hover:bg-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> নতুন অর্ডার
            </button>
            <button 
              onClick={handleDelete}
              disabled={isProcessing || selectedIds.length === 0}
              className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" /> ডিলিট
            </button>
            <button 
              onClick={downloadCSV}
              className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> CSV ডাউনলোড
            </button>
            <button 
              onClick={() => {
                if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!')
                window.open(`/print/invoice?ids=${selectedIds.join(',')}`, '_blank')
              }}
              disabled={selectedIds.length === 0}
              className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <FileText className="h-3.5 w-3.5" /> Print Invoices
            </button>
            <button 
              onClick={() => handleStatusChange('Confirmed')}
              disabled={isProcessing || selectedIds.length === 0}
              className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Confirm & Notify
            </button>
            <button 
              onClick={handleDispatch}
              disabled={isProcessing || selectedIds.length === 0}
              className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Truck className="h-3.5 w-3.5" /> Dispatch
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) handleStatusChange(e.target.value)
                e.target.value = ""
              }}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium outline-none focus:border-zinc-500"
            >
              <option value="">Status পরিবর্তন...</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="On Hold">On Hold</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Returning">Returning</option>
              <option value="Return Received">Return Received</option>
              <option value="Incomplete">Incomplete</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition">
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="সার্চ করুন..." 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-zinc-600" 
              />
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
          <span>{selectedIds.length} টি সিলেক্টেড | মোট {filtered.length} টি অর্ডার</span>
          <div className="space-x-3">
            <button onClick={() => setSelectedIds(filtered.map(o => o.id))} className="text-orange-400 hover:text-orange-300">সব সিলেক্ট ({filtered.length})</button>
            <button onClick={() => setSelectedIds([])} className="text-red-400 hover:text-red-300">সব বাদ দিন</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-zinc-400 border-collapse">
            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-xs uppercase font-medium text-zinc-500">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleSelectAll}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                  />
                </th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading || isProcessing ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length > 0 ? filtered.map(order => (
                <tr 
                  key={order.id} 
                  className={cn(
                    "hover:bg-zinc-900/30 transition-colors",
                    selectedIds.includes(order.id) ? "bg-zinc-900/50 border-l-2 border-l-orange-500" : ""
                  )}
                >
                  <td className="px-4 py-4 align-top">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(order.id)}
                      onChange={() => handleSelectOne(order.id)}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-zinc-300 font-semibold">
                      #{order.bondhumartId || order.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-zinc-200 font-medium">{order.customer?.name || 'Unknown'}</div>
                    <div className="text-zinc-500 text-xs font-mono mt-1">{order.customer?.phone}</div>
                    {order.customer?.address && <div className="text-zinc-600 text-xs mt-0.5 max-w-[200px] truncate">{order.customer.address}</div>}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-zinc-300 text-xs">{order.product?.name || 'Product'}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">x{order.quantity || 1}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full border text-[11px] font-medium tracking-wide uppercase",
                      getStatusColor(order.status)
                    )}>
                      {order.status}
                    </span>
                    {order.courierName && (
                      <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                        <Truck className="h-3 w-3" /> {order.courierName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-emerald-400 font-bold">৳{(order.amount || 0).toLocaleString()}</div>
                    {(order.deliveryCharge || 0) > 0 && (
                      <div className="text-xs text-zinc-500 mt-0.5">+৳{order.deliveryCharge} delivery</div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => openDetailsModal(order)} 
                        title="ট্র্যাকিং দেখুন"
                        className="p-1.5 bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-400 rounded-md transition text-zinc-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => openEditModal(order)} 
                        title="এডিট করুন"
                        className="p-1.5 bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-md transition text-zinc-400"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                    এই ট্যাবে কোনো অর্ডার নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== NEW ORDER MODAL ========== */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-400" /> নতুন অর্ডার তৈরি</h2>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">কাস্টমারের নাম *</label>
                  <input value={newForm.customerName} onChange={e => setNewForm({...newForm, customerName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="নাম" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">ফোন নম্বর *</label>
                  <input value={newForm.phone} onChange={e => setNewForm({...newForm, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="01XXXXXXXXX" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs mb-1">ঠিকানা</label>
                <input value={newForm.address} onChange={e => setNewForm({...newForm, address: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="বিস্তারিত ঠিকানা" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">জেলা</label>
                  <input value={newForm.district} onChange={e => setNewForm({...newForm, district: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="জেলা" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">প্রোডাক্ট</label>
                  <input value={newForm.product} onChange={e => setNewForm({...newForm, product: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="প্রোডাক্টের নাম" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">পরিমাণ</label>
                  <input type="number" value={newForm.quantity} onChange={e => setNewForm({...newForm, quantity: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">মোট টাকা (৳)</label>
                  <input type="number" value={newForm.amount} onChange={e => setNewForm({...newForm, amount: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">ডেলিভারি চার্জ</label>
                  <input type="number" value={newForm.deliveryCharge} onChange={e => setNewForm({...newForm, deliveryCharge: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs mb-1">স্ট্যাটাস</label>
                <select value={newForm.status} onChange={e => setNewForm({...newForm, status: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-sm">বাতিল</button>
              <button onClick={handleCreateOrder} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition text-sm disabled:opacity-50">
                {isProcessing ? 'তৈরি হচ্ছে...' : 'অর্ডার তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT ORDER MODAL ========== */}
      {showEditModal && editOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit className="h-5 w-5 text-blue-400" /> অর্ডার এডিট - #{editOrder.bondhumartId || editOrder.id.slice(-6)}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">কাস্টমারের নাম</label>
                  <input value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">ফোন নম্বর</label>
                  <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs mb-1">ঠিকানা</label>
                <input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">জেলা</label>
                  <input value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">প্রোডাক্ট</label>
                  <input value={editForm.product} onChange={e => setEditForm({...editForm, product: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">পরিমাণ</label>
                  <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">মোট টাকা (৳)</label>
                  <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">ডেলিভারি চার্জ</label>
                  <input type="number" value={editForm.deliveryCharge} onChange={e => setEditForm({...editForm, deliveryCharge: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-sm">বাতিল</button>
              <button onClick={handleEditOrder} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-400 transition text-sm disabled:opacity-50">
                {isProcessing ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ORDER DETAILS / TRACKING MODAL ========== */}
      {showDetailsModal && detailsOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-400" /> 
                অর্ডার #{detailsOrder.bondhumartId || detailsOrder.id.slice(-6).toUpperCase()}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              
              {/* Order Tracking Progress */}
              {getStatusStep(detailsOrder.status) >= 0 ? (
                <div className="bg-zinc-900 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4">📦 অর্ডার ট্র্যাকিং</h3>
                  <div className="flex items-center justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-800 z-0" />
                    <div 
                      className="absolute top-4 left-4 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                      style={{ width: `${(getStatusStep(detailsOrder.status) / 3) * 100}%`, maxWidth: 'calc(100% - 32px)' }}
                    />
                    
                    {STATUS_FLOW.map((step, i) => {
                      const currentStep = getStatusStep(detailsOrder.status)
                      const isDone = i <= currentStep
                      const isCurrent = i === currentStep
                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                            isDone ? "bg-emerald-500 border-emerald-500 text-black" : "bg-zinc-900 border-zinc-700 text-zinc-500",
                            isCurrent && "ring-2 ring-emerald-500/30 scale-110"
                          )}>
                            {isDone ? '✓' : i + 1}
                          </div>
                          <span className={cn("text-[10px] mt-2 font-medium", isDone ? "text-emerald-400" : "text-zinc-600")}>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <span className={cn("px-3 py-1.5 rounded-full border text-sm font-medium", getStatusColor(detailsOrder.status))}>
                    {detailsOrder.status}
                  </span>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">👤 কাস্টমার তথ্য</h3>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-200">{detailsOrder.customer?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-200 font-mono">{detailsOrder.customer?.phone}</span>
                </div>
                {detailsOrder.customer?.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <span className="text-zinc-200">{detailsOrder.customer.address}{detailsOrder.customer.district ? `, ${detailsOrder.customer.district}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">🛒 অর্ডার তথ্য</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">প্রোডাক্ট</span>
                  <span className="text-zinc-200">{detailsOrder.product?.name} x{detailsOrder.quantity || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">মূল্য</span>
                  <span className="text-emerald-400 font-bold">৳{(detailsOrder.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">ডেলিভারি চার্জ</span>
                  <span className="text-zinc-200">৳{(detailsOrder.deliveryCharge || 0).toLocaleString()}</span>
                </div>
                <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
                  <span className="text-zinc-300 font-semibold">মোট</span>
                  <span className="text-emerald-400 font-bold text-base">৳{((detailsOrder.amount || 0) + (detailsOrder.deliveryCharge || 0)).toLocaleString()}</span>
                </div>
                {detailsOrder.courierName && (
                  <>
                    <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
                      <span className="text-zinc-500">কুরিয়ার</span>
                      <span className="text-orange-400">{detailsOrder.courierName}</span>
                    </div>
                    {detailsOrder.courierTracking && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">ট্র্যাকিং নং</span>
                        <span className="text-blue-400 font-mono">{detailsOrder.courierTracking}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">তারিখ</span>
                  <span className="text-zinc-200 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(detailsOrder.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-between">
              <button onClick={() => { setShowDetailsModal(false); openEditModal(detailsOrder) }} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition text-sm flex items-center gap-2">
                <Edit className="h-4 w-4" /> এডিট করুন
              </button>
              <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition text-sm">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
