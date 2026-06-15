"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Download, Upload, Filter, X, FileSpreadsheet, CheckCircle2, Edit2, Save, MessageCircle, User, MapPin, Package, ShoppingBag, Calendar, ArrowRight, Trash2 } from "lucide-react"
import * as XLSX from "xlsx"

// Default mock data
const defaultCustomers = [
  { id: 1, name: "Rakib Raja", phone: "01819000000", email: "rakib@example.com", district: "Dhaka", thana: "Mirpur", address: "Mirpur 10", product: "AI Course", orderId: "ORD-101", deliveryCharge: 60, totalOrders: 5, totalSpent: 12500, date: "15 Jun 2026", status: "Delivered 🟢" },
  { id: 2, name: "Tanvir Ahmed", phone: "01712000000", email: "tanvir@example.com", district: "Chattogram", thana: "Panchlaish", address: "O.R. Nizam Road", product: "Web Dev Course", orderId: "ORD-102", deliveryCharge: 100, totalOrders: 1, totalSpent: 1200, date: "14 Jun 2026", status: "Pending 🟡" },
  { id: 3, name: "Sajid Hasan", phone: "01614000000", email: "", district: "Sylhet", thana: "Zindabazar", address: "Zindabazar Road", product: "SEO Mastery", orderId: "ORD-103", deliveryCharge: 120, totalOrders: 2, totalSpent: 3400, date: "10 Jun 2026", status: "Returned 🟣" },
  { id: 4, name: "Mehedi", phone: "01915000000", email: "", district: "", thana: "", address: "", product: "", orderId: "", deliveryCharge: 0, totalOrders: 0, totalSpent: 0, date: "-", status: "Raw Leads 📱" },
]

const TABS = ['All', 'Pending 🟡', 'Confirmed 🔵', 'Delivered 🟢', 'Returned 🟣', 'Hold 🟠', 'Cancelled 🔴', 'Raw Leads 📱']

// Helper to auto-extract district & thana from raw address
const extractAddressInfo = (fullAddress: string) => {
  if (!fullAddress) return { district: "", thana: "" };
  const lowerAddr = fullAddress.toLowerCase();
  
  const districts = ["dhaka", "chattogram", "sylhet", "rajshahi", "khulna", "barishal", "rangpur", "mymensingh", "cumilla", "gazipur", "narayanganj", "bogra", "noakhali", "faridpur", "tangail", "brahmanbaria", "chandpur", "cox's bazar"];
  
  let foundDistrict = "";
  for (const d of districts) {
    if (lowerAddr.includes(d)) {
      foundDistrict = d.charAt(0).toUpperCase() + d.slice(1);
      break;
    }
  }

  let foundThana = "";
  if (lowerAddr.includes("mirpur")) foundThana = "Mirpur";
  else if (lowerAddr.includes("uttara")) foundThana = "Uttara";
  else if (lowerAddr.includes("dhanmondi")) foundThana = "Dhanmondi";
  else if (lowerAddr.includes("gulshan")) foundThana = "Gulshan";
  else if (lowerAddr.includes("savar")) foundThana = "Savar";
  else if (lowerAddr.includes("panchlaish")) foundThana = "Panchlaish";
  else if (lowerAddr.includes("zindabazar")) foundThana = "Zindabazar";
  else if (lowerAddr.includes("badda")) foundThana = "Badda";
  else if (lowerAddr.includes("banani")) foundThana = "Banani";
  else if (lowerAddr.includes("motijheel")) foundThana = "Motijheel";
  else if (lowerAddr.includes("jatrabari")) foundThana = "Jatrabari";
  
  return { district: foundDistrict, thana: foundThana };
}

const COLUMN_DEF = {
  customerInfo: { label: 'Customer Info' },
  orderId: { label: 'Order ID' },
  product: { label: 'Product' },
  address: { label: 'Address' },
  delivery: { label: 'Delivery' },
  amount: { label: 'Amount' },
  date: { label: 'Date' },
  status: { label: 'Status' }
}

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [customers, setCustomers] = useState(defaultCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  
  // Drag to Scroll Refs & State
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Column Reordering State
  const [columnsOrder, setColumnsOrder] = useState<string[]>(Object.keys(COLUMN_DEF))

  // ====== localStorage: Load on mount ======
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bondhu_customers')
      if (saved) setCustomers(JSON.parse(saved))
      const savedCols = localStorage.getItem('bondhu_col_order')
      if (savedCols) setColumnsOrder(JSON.parse(savedCols))
    } catch (e) {}
    setIsLoaded(true)
  }, [])

  // ====== localStorage: Save on change ======
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bondhu_customers', JSON.stringify(customers))
      localStorage.setItem('bondhu_col_order', JSON.stringify(columnsOrder))
    }
  }, [customers, columnsOrder, isLoaded])

  // Custom Columns Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [visibleCols, setVisibleCols] = useState({
    customerInfo: true,
    orderId: true,
    product: true,
    address: true,
    delivery: true,
    amount: true,
    date: true,
    status: true,
  })

  // CSV/Excel Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [uploadTargetSegment, setUploadTargetSegment] = useState('')
  const [colMap, setColMap] = useState({
    name: "", phone: "", address: "", product: "", orderId: "", deliveryCharge: "", totalSpent: "", date: ""
  })

  // Customer Details / Edit Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState<any>({})

  // Handle File Upload & Parse with XLSX
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)
      
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet)
          
          if (json.length > 0) {
            setParsedData(json)
            setFileHeaders(Object.keys(json[0] as object))
          }
        } catch (error) {
          alert("File parsing failed. Please upload a valid CSV or XLSX file.")
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  // Handle Dynamic Mapping Submission
  const handleProcessMappedCsv = () => {
    if (!uploadTargetSegment) {
      alert("দয়া করে একটি স্ট্যাটাস সেগমেন্ট সিলেক্ট করুন!")
      return
    }
    
    const newCustomers = parsedData.map((row, index) => {
      const rawAddress = colMap.address ? String(row[colMap.address] || "") : "";
      const { district, thana } = extractAddressInfo(rawAddress);

      return {
        id: Date.now() + index,
        name: colMap.name ? String(row[colMap.name] || "") : "Unknown",
        phone: colMap.phone ? String(row[colMap.phone] || "") : "No Phone",
        email: "",
        district: district,
        thana: thana,
        address: rawAddress,
        product: colMap.product ? String(row[colMap.product] || "") : "",
        orderId: colMap.orderId ? String(row[colMap.orderId] || "") : `NEW-${(Date.now() + index).toString().slice(-4)}`,
        deliveryCharge: colMap.deliveryCharge ? Number(row[colMap.deliveryCharge]) || 0 : 0,
        totalOrders: 1,
        totalSpent: colMap.totalSpent ? Number(row[colMap.totalSpent]) || 0 : 0,
        date: colMap.date ? String(row[colMap.date] || "") : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: uploadTargetSegment
      }
    })

    setCustomers(prev => [...newCustomers, ...prev])
    resetUploadState()
    alert(`✅ ${newCustomers.length} জন কাস্টমার সফলভাবে '${uploadTargetSegment}' ট্যাবে আপলোড হয়েছে!`)
  }

  const resetUploadState = () => {
    setIsUploadModalOpen(false)
    setUploadStep(1)
    setSelectedFile(null)
    setParsedData([])
    setFileHeaders([])
    setUploadTargetSegment('')
    setColMap({ name: "", phone: "", address: "", product: "", orderId: "", deliveryCharge: "", totalSpent: "", date: "" })
  }

  const handleDeleteSelected = () => {
    if (confirm(`আপনি কি নিশ্চিত যে ${selectedIds.length} জন কাস্টমারকে ডিলিট করতে চান?`)) {
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)))
      setSelectedIds([])
    }
  }

  const openCustomerDetails = (customer: any) => {
    setSelectedCustomer(customer)
    setDetailsForm({ ...customer })
    setIsEditingDetails(false)
  }

  const saveCustomerDetails = () => {
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? detailsForm : c))
    setSelectedCustomer(detailsForm)
    setIsEditingDetails(false)
  }

  const filteredCustomers = customers.filter(c => {
    const matchesTab = activeTab === 'All' || c.status === activeTab
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery) || 
                          c.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const getSmartGuess = (keywords: string[]) => {
    return fileHeaders.find(h => keywords.some(k => h.toLowerCase().includes(k))) || ""
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCustomers)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Customers")
    XLSX.writeFile(wb, `Bondhu_Customers_${activeTab.replace(/[^a-zA-Z]/g, '')}.xlsx`)
  }

  // --- Drag to Scroll Handlers ---
  const handleScrollMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }
  const handleScrollMouseLeave = () => setIsDragging(false)
  const handleScrollMouseUp = () => setIsDragging(false)
  const handleScrollMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Scroll-fast factor
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  // --- Column Reorder Handlers ---
  const handleColDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('colIdx', index.toString())
  }
  const handleColDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('colIdx'))
    if (isNaN(dragIndex) || dragIndex === dropIndex) return
    const newOrder = [...columnsOrder]
    const [draggedItem] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, draggedItem)
    setColumnsOrder(newOrder)
  }

  const renderCellContent = (customer: any, colKey: string) => {
    switch (colKey) {
      case 'customerInfo': return (
        <>
          <div className="font-medium text-zinc-100 group-hover:text-blue-400 transition-colors select-text">{customer.name || "Unknown"}</div>
          <div className="text-zinc-500 text-xs select-text">{customer.phone}</div>
        </>
      )
      case 'orderId': return <span className="font-medium text-zinc-300 select-text">{customer.orderId || "-"}</span>
      case 'product': return <span className="text-zinc-400 select-text">{customer.product || "-"}</span>
      case 'address': return (
        <>
          {customer.district ? (
            <>
              <div className="text-zinc-200 select-text">{customer.district}, {customer.thana}</div>
              <div className="text-zinc-500 text-xs truncate max-w-[150px] select-text">{customer.address}</div>
            </>
          ) : (
            <span className="text-zinc-600 select-text">{customer.address || "-"}</span>
          )}
        </>
      )
      case 'delivery': return <span className="text-zinc-400 select-text">{customer.deliveryCharge ? `৳ ${customer.deliveryCharge}` : "-"}</span>
      case 'amount': return <span className="font-medium text-blue-400 select-text">{customer.totalSpent ? `৳ ${customer.totalSpent.toLocaleString()}` : "-"}</span>
      case 'date': return <span className="text-zinc-400 select-text">{customer.date || "-"}</span>
      case 'status': return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
          customer.status.includes('Delivered') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          customer.status.includes('Returned') || customer.status.includes('Cancelled') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
          customer.status.includes('Pending') || customer.status.includes('Hold') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          {customer.status}
        </span>
      )
      default: return null
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 bg-black h-screen overflow-hidden flex flex-col text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Customers & CRM</h2>
          <p className="text-zinc-400 mt-1 text-sm">Manage all your leads, active customers, and AI segmentations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 bg-rose-600/10 text-rose-500 border border-rose-500/20 px-3 py-2 rounded-lg font-medium hover:bg-rose-600/20 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-800 text-white px-3 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
          >
            <Upload className="h-4 w-4" />
            Import Data
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col flex-1 relative">
        {/* Toolbar */}
        <div className="p-3 md:p-4 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50 shrink-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            <div className="relative w-full lg:flex-1 lg:max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or order ID..." 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
              />
            </div>
            
            <div className="flex items-center w-full lg:w-auto justify-between lg:justify-end gap-3">
              <div className="text-sm text-zinc-400 font-medium bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 whitespace-nowrap">
                Showing <span className="text-white">{filteredCustomers.length}</span> of <span className="text-white">{customers.length}</span>
              </div>
              
              {/* Filter Custom Columns Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-300"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter Columns</span>
                </button>
                
                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-20 p-2">
                      <div className="text-xs font-semibold text-zinc-500 uppercase px-3 py-2 mb-1">Visible Columns</div>
                      {Object.keys(visibleCols).map(col => (
                        <label key={col} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={visibleCols[col as keyof typeof visibleCols]}
                            onChange={(e) => setVisibleCols({...visibleCols, [col]: e.target.checked})}
                            className="rounded bg-zinc-900 border-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-950 h-4 w-4"
                          />
                          <span className="text-sm text-zinc-300 capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(tab => {
              const count = tab === 'All' ? customers.length : customers.filter(c => c.status === tab).length;
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-2 ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20' 
                      : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Table — scrollable and draggable */}
        <div 
          ref={scrollRef}
          onMouseDown={handleScrollMouseDown}
          onMouseLeave={handleScrollMouseLeave}
          onMouseUp={handleScrollMouseUp}
          onMouseMove={handleScrollMouseMove}
          className={`overflow-auto flex-1 bg-zinc-950 custom-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-auto'}`}
        >
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead className="text-xs uppercase bg-zinc-900 border-b border-zinc-800 text-zinc-400 whitespace-nowrap sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 font-medium w-12 text-center sticky left-0 z-30 bg-zinc-900 border-r border-zinc-800/50">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredCustomers.map(c => c.id))
                      else setSelectedIds([])
                    }}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-zinc-950 cursor-pointer transition-all"
                  />
                </th>
                {columnsOrder.map((colKey, index) => {
                  if (!visibleCols[colKey as keyof typeof visibleCols]) return null
                  return (
                    <th 
                      key={colKey} 
                      draggable
                      onDragStart={(e) => handleColDragStart(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleColDrop(e, index)}
                      className="px-4 py-3 font-medium cursor-grab active:cursor-grabbing hover:bg-zinc-800 transition-colors select-none group relative"
                      title="Drag to reorder columns"
                    >
                      <div className="flex items-center gap-2">
                        {COLUMN_DEF[colKey as keyof typeof COLUMN_DEF].label}
                        <div className="opacity-0 group-hover:opacity-100 text-zinc-600">⋮⋮</div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-zinc-500">
                    No records found in &quot;{activeTab}&quot; segment.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    onClick={() => openCustomerDetails(customer)}
                    className={`transition-colors whitespace-nowrap cursor-pointer group ${selectedIds.includes(customer.id) ? 'bg-blue-900/20' : 'hover:bg-zinc-900/80'}`}
                  >
                    <td className="px-4 py-3 text-center sticky left-0 z-10 bg-zinc-950 border-r border-zinc-800/50 group-hover:bg-zinc-900/80" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, customer.id])
                          else setSelectedIds(selectedIds.filter(id => id !== customer.id))
                        }}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-zinc-950 cursor-pointer transition-all"
                      />
                    </td>
                    
                    {columnsOrder.map((colKey) => {
                      if (!visibleCols[colKey as keyof typeof visibleCols]) return null
                      return (
                        <td key={colKey} className="px-4 py-3">
                          {renderCellContent(customer, colKey)}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== UPLOAD MODAL ====== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Import Data (Excel/CSV)</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  {uploadStep === 1 ? "Upload your file." : "Map your file's columns to BondhuOS fields."}
                </p>
              </div>
              <button onClick={resetUploadState} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Target Segment */}
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-200">Select Target Segment</label>
                <select 
                  value={uploadTargetSegment}
                  onChange={(e) => setUploadTargetSegment(e.target.value)}
                  className="w-full bg-zinc-900 text-white border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose where to save these records --</option>
                  <option value="Pending 🟡">Pending 🟡</option>
                  <option value="Hold 🟠">Hold 🟠</option>
                  <option value="Confirmed 🔵">Confirmed 🔵</option>
                  <option value="Delivered 🟢">Delivered 🟢</option>
                  <option value="Returned 🟣">Returned 🟣</option>
                  <option value="Cancelled 🔴">Cancelled 🔴</option>
                </select>
              </div>

              {uploadStep === 1 ? (
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-900 transition-colors cursor-pointer group relative bg-zinc-950 overflow-hidden">
                  <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls"
                    title=" "
                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                    style={{ color: "transparent" }}
                    onChange={handleFileUpload}
                  />
                  {selectedFile && parsedData.length > 0 ? (
                    <>
                      <div className="p-4 bg-emerald-500/10 rounded-full mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div>
                      <h4 className="font-semibold mb-1 text-emerald-400">{selectedFile.name}</h4>
                      <p className="text-sm text-zinc-400">{parsedData.length} rows found. Click &apos;Next&apos; to map columns.</p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-zinc-800 rounded-full mb-4"><FileSpreadsheet className="h-8 w-8 text-zinc-400" /></div>
                      <h4 className="font-semibold mb-1 text-zinc-200">Click or drag Excel/CSV file</h4>
                      <p className="text-sm text-zinc-500">Supported: .xlsx, .xls, .csv</p>
                    </>
                  )}
                </div>
              ) : (
                /* STEP 2: COLUMN MAPPING */
                <div className="space-y-3">
                  <div className="bg-blue-900/20 text-blue-400 p-3 rounded-lg text-sm border border-blue-900/50">
                    <span className="font-bold">Note:</span> The dropdowns only show columns that exist in your uploaded Excel file. If a column is missing in your file, leave it as "-- Ignore this field --".
                  </div>
                  
                  {[
                    { id: 'name', label: 'Customer Name', req: true },
                    { id: 'phone', label: 'Phone Number', req: true },
                    { id: 'address', label: 'Full Address', req: false },
                    { id: 'product', label: 'Product Name', req: false },
                    { id: 'orderId', label: 'Order ID / Invoice', req: false },
                    { id: 'deliveryCharge', label: 'Delivery Charge', req: false },
                    { id: 'totalSpent', label: 'Total Amount / Price', req: false },
                    { id: 'date', label: 'Date', req: false }
                  ].map((field) => (
                    <div key={field.id} className="grid grid-cols-2 gap-3 items-center">
                      <label className="text-sm font-medium text-zinc-300">
                        {field.label} {field.req && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={colMap[field.id as keyof typeof colMap]}
                        onChange={(e) => setColMap({...colMap, [field.id]: e.target.value})}
                        className="w-full bg-zinc-900 text-white border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignore this field --</option>
                        {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
              <button onClick={resetUploadState} className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg font-medium transition-colors text-zinc-300 text-sm">Cancel</button>
              
              {uploadStep === 1 ? (
                <button 
                  onClick={() => {
                    setColMap({
                      name: getSmartGuess(['name', 'customer', 'নাম']),
                      phone: getSmartGuess(['phone', 'mobile', 'contact', 'ফোন']),
                      address: getSmartGuess(['address', 'location', 'ঠিকানা']),
                      product: getSmartGuess(['product', 'item', 'প্রোডাক্ট']),
                      orderId: getSmartGuess(['order', 'invoice', 'id']),
                      deliveryCharge: getSmartGuess(['delivery', 'shipping', 'charge', 'ডেলিভারি']),
                      totalSpent: getSmartGuess(['total', 'price', 'amount', 'spent', 'দাম']),
                      date: getSmartGuess(['date', 'time', 'created', 'তারিখ'])
                    })
                    setUploadStep(2)
                  }}
                  disabled={!selectedFile || parsedData.length === 0}
                  className={`px-4 py-2 flex items-center gap-2 rounded-lg font-medium transition-colors text-sm ${
                    !selectedFile || parsedData.length === 0 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next: Map Columns <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={handleProcessMappedCsv}
                  disabled={!colMap.name || !colMap.phone}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    !colMap.name || !colMap.phone 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Upload & Process
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== CUSTOMER DETAILS MODAL ====== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/30 shrink-0">
              <div className="flex gap-4 items-center">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
                  {(selectedCustomer.name || "?").charAt(0)}
                </div>
                <div>
                  {isEditingDetails ? (
                    <input type="text" value={detailsForm.name} onChange={e => setDetailsForm({...detailsForm, name: e.target.value})} className="text-xl font-bold bg-zinc-900 border border-zinc-700 rounded px-2 py-1 mb-1 focus:outline-none focus:border-blue-500 w-full" />
                  ) : (
                    <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-medium text-zinc-300">ID: {selectedCustomer.orderId || "N/A"}</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs font-medium text-blue-400">{selectedCustomer.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditingDetails ? (
                  <>
                    <button className="flex items-center gap-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-600/20 transition-colors text-sm">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </button>
                    <button onClick={() => setIsEditingDetails(true)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button onClick={saveCustomerDetails} className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm">
                    <Save className="h-4 w-4" /> Save
                  </button>
                )}
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content — scrollable */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
              
              {/* LEFT: Contact */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="h-3.5 w-3.5" /> Contact Information</h4>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Phone Number</div>
                      {isEditingDetails ? (
                        <input type="text" value={detailsForm.phone} onChange={e => setDetailsForm({...detailsForm, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      ) : (
                        <div className="font-medium text-zinc-200">{selectedCustomer.phone}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Email</div>
                      {isEditingDetails ? (
                        <input type="email" value={detailsForm.email} onChange={e => setDetailsForm({...detailsForm, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      ) : (
                        <div className="font-medium text-zinc-200">{selectedCustomer.email || "No email"}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Delivery Address</h4>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                    {isEditingDetails ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">District</div>
                            <input type="text" value={detailsForm.district} onChange={e => setDetailsForm({...detailsForm, district: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">Thana</div>
                            <input type="text" value={detailsForm.thana} onChange={e => setDetailsForm({...detailsForm, thana: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">Full Address</div>
                          <textarea value={detailsForm.address} onChange={e => setDetailsForm({...detailsForm, address: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm h-20 resize-none" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-zinc-200">{selectedCustomer.district || selectedCustomer.thana ? `${selectedCustomer.district || ''}, ${selectedCustomer.thana || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') : "N/A"}</div>
                        <div className="text-sm text-zinc-400">{selectedCustomer.address || "No address"}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Order */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5" /> Order Details</h4>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Package className="h-3 w-3"/> Product</div>
                      {isEditingDetails ? (
                        <input type="text" value={detailsForm.product} onChange={e => setDetailsForm({...detailsForm, product: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      ) : (
                        <div className="font-medium text-zinc-200">{selectedCustomer.product || "N/A"}</div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                        <div className="text-xs text-zinc-500 mb-1">Total Amount</div>
                        {isEditingDetails ? (
                          <input type="number" value={detailsForm.totalSpent} onChange={e => setDetailsForm({...detailsForm, totalSpent: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-sm text-blue-400" />
                        ) : (
                          <div className="font-bold text-lg text-blue-400">৳ {selectedCustomer.totalSpent || 0}</div>
                        )}
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                        <div className="text-xs text-zinc-500 mb-1">Delivery Charge</div>
                        {isEditingDetails ? (
                          <input type="number" value={detailsForm.deliveryCharge} onChange={e => setDetailsForm({...detailsForm, deliveryCharge: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-sm" />
                        ) : (
                          <div className="font-bold text-lg text-zinc-300">৳ {selectedCustomer.deliveryCharge || 0}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3"/> Order Date</div>
                      {isEditingDetails ? (
                        <input type="text" value={detailsForm.date} onChange={e => setDetailsForm({...detailsForm, date: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      ) : (
                        <div className="font-medium text-zinc-200">{selectedCustomer.date || "Unknown"}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Order ID</div>
                      {isEditingDetails ? (
                        <input type="text" value={detailsForm.orderId} onChange={e => setDetailsForm({...detailsForm, orderId: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      ) : (
                        <div className="font-medium text-zinc-200">{selectedCustomer.orderId || "N/A"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
