"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Plus, CheckCircle2, Truck, Search, Upload, X, Package, ArrowRight, Trash2 } from "lucide-react"
import * as XLSX from "xlsx"

interface OrderItem {
  id: string
  customerName: string
  phone: string
  address: string
  district: string
  product: string
  quantity: number
  amount: number
  deliveryCharge: number
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'returned_received'
  source: string
  courierName?: string
  trackingNo?: string
  consignmentId?: string | number
  createdAt: string
  shippedAt?: string
}

const formatPhoneForCourier = (phone: string | number) => {
  if (!phone) return "No Phone"
  let cleaned = String(phone).replace(/[^\d+]/g, '')
  // Courier APIs usually want 11 digits: 01xxxxxxxxx
  if (cleaned.startsWith('+8801')) return cleaned.replace('+88', '')
  if (cleaned.startsWith('8801')) return cleaned.substring(2)
  if (cleaned.length === 10 && cleaned.startsWith('1')) return '0' + cleaned
  return cleaned
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'returned_received'>('new')
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCourierModal, setShowCourierModal] = useState(false)
  const [selectedCourier, setSelectedCourier] = useState('steadfast')

  // New order form
  const [nName, setNName] = useState('')
  const [nPhone, setNPhone] = useState('')
  const [nAddress, setNAddress] = useState('')
  const [nDistrict, setNDistrict] = useState('')
  const [nProduct, setNProduct] = useState('')
  const [nQty, setNQty] = useState('1')
  const [nAmount, setNAmount] = useState('')
  const [nDelivery, setNDelivery] = useState('80')
  const [isSending, setIsSending] = useState(false)

  // Edit Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [eName, setEName] = useState('')
  const [ePhone, setEPhone] = useState('')
  const [eAddress, setEAddress] = useState('')
  const [eDistrict, setEDistrict] = useState('')
  const [eProduct, setEProduct] = useState('')
  const [eQty, setEQty] = useState('1')
  const [eAmount, setEAmount] = useState('')
  const [eDelivery, setEDelivery] = useState('80')

  // Excel Import State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [colMap, setColMap] = useState({
    name: "", phone: "", address: "", district: "", product: "", quantity: "", amount: "", delivery: ""
  })

  useEffect(() => {
    try {
      const data = localStorage.getItem('bondhu_orders')
      if (data) setOrders(JSON.parse(data))
    } catch (e) { console.error(e) }
  }, [])

  const saveOrders = (updated: OrderItem[]) => {
    setOrders(updated)
    localStorage.setItem('bondhu_orders', JSON.stringify(updated))
  }

  const filtered = orders.filter(o => o.status === activeTab && (
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.phone.includes(search) ||
    o.product.toLowerCase().includes(search.toLowerCase())
  ))

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([])
    else setSelectedIds(filtered.map(o => o.id))
  }

  const handleAddOrder = () => {
    if (!nName || !nPhone || !nProduct || !nAmount) return alert('সব ফিল্ড পূরণ করুন!')
    const newOrder: OrderItem = {
      id: 'ORD-' + Date.now(),
      customerName: nName,
      phone: formatPhoneForCourier(nPhone),
      address: nAddress,
      district: nDistrict,
      product: nProduct,
      quantity: Number(nQty),
      amount: Number(nAmount),
      deliveryCharge: Number(nDelivery),
      status: 'new',
      source: 'Manual',
      createdAt: new Date().toISOString()
    }
    saveOrders([newOrder, ...orders])
    setShowAddModal(false)
    setNName(''); setNPhone(''); setNAddress(''); setNDistrict(''); setNProduct(''); setNQty('1'); setNAmount(''); setNDelivery('80')
  }

  // --- EXCEL/CSV IMPORT LOGIC ---
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
            const headers = Object.keys(json[0] as object)
            setFileHeaders(headers)

            // Auto-select columns based on common names
            const autoMap: any = { name: "", phone: "", address: "", district: "", product: "", quantity: "", amount: "", delivery: "" }
            headers.forEach(h => {
              const lower = h.toLowerCase()
              if (!autoMap.name && (lower.includes('name') || lower.includes('customer'))) autoMap.name = h
              else if (!autoMap.phone && (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact'))) autoMap.phone = h
              else if (!autoMap.address && (lower.includes('address') || lower.includes('location'))) autoMap.address = h
              else if (!autoMap.district && (lower.includes('district') || lower.includes('city'))) autoMap.district = h
              else if (!autoMap.product && (lower.includes('product') || lower.includes('item'))) autoMap.product = h
              else if (!autoMap.quantity && (lower.includes('qty') || lower.includes('quantity'))) autoMap.quantity = h
              else if (!autoMap.amount && (lower.includes('amount') || lower.includes('price') || lower.includes('total') || lower.includes('subtotal'))) autoMap.amount = h
              else if (!autoMap.delivery && (lower.includes('delivery') || lower.includes('charge') || lower.includes('shipping'))) autoMap.delivery = h
            })
            setColMap(autoMap)
          }
        } catch (error) {
          alert("File parsing failed. Please upload a valid CSV or XLSX file.")
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleProcessMappedData = () => {
    const newOrders = parsedData.map((row, index) => {
      const rawPhone = colMap.phone ? row[colMap.phone] : ""
      return {
        id: 'IMP-' + Date.now() + '-' + index,
        customerName: colMap.name ? String(row[colMap.name] || "Unknown") : "Unknown",
        phone: formatPhoneForCourier(rawPhone),
        address: colMap.address ? String(row[colMap.address] || "") : "",
        district: colMap.district ? String(row[colMap.district] || "") : "",
        product: colMap.product ? String(row[colMap.product] || "") : "",
        quantity: colMap.quantity ? Number(row[colMap.quantity]) || 1 : 1,
        amount: colMap.amount ? Number(row[colMap.amount]) || 0 : 0,
        deliveryCharge: colMap.delivery && row[colMap.delivery] !== undefined ? Number(row[colMap.delivery]) : 0,
        status: 'confirmed' as const, // Imported orders go straight to confirmed
        source: 'Website Import',
        createdAt: new Date().toISOString()
      }
    }).filter(o => o.phone && o.phone !== "No Phone")

    if (newOrders.length > 0) {
      saveOrders([...newOrders, ...orders])
      alert(`✅ ${newOrders.length} টি অর্ডার সফলভাবে "Confirmed Orders"-এ ইম্পোর্ট হয়েছে!`)
    }

    setIsUploadModalOpen(false)
    setUploadStep(1)
    setSelectedFile(null)
    setParsedData([])
    setColMap({ name: "", phone: "", address: "", district: "", product: "", quantity: "", amount: "", delivery: "" })
  }

  // --- WORKFLOW ACTIONS ---
  const openEditModal = (o: OrderItem) => {
    setSelectedOrder(o)
    setEName(o.customerName)
    setEPhone(o.phone)
    setEAddress(o.address)
    setEDistrict(o.district)
    setEProduct(o.product)
    setEQty(String(o.quantity))
    setEAmount(String(o.amount))
    setEDelivery(String(o.deliveryCharge))
    setIsEditModalOpen(true)
  }

  const saveEditedOrder = () => {
    if (!selectedOrder) return
    const updated = orders.map(o => o.id === selectedOrder.id ? {
      ...o,
      customerName: eName,
      phone: formatPhoneForCourier(ePhone),
      address: eAddress,
      district: eDistrict,
      product: eProduct,
      quantity: Number(eQty),
      amount: Number(eAmount),
      deliveryCharge: Number(eDelivery)
    } : o)
    saveOrders(updated)
    setIsEditModalOpen(false)
  }

  const getInvoiceConfig = () => {
    let config = {
      theme: 'bw',
      grid: '3x3',
      courierPosition: 'top-right',
      showSellerAddress: true,
      showCustomerPhone: true
    };
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bondhu_invoice_config');
        if (saved) config = JSON.parse(saved);
      }
    } catch (e) {}
    return config;
  }

  const getInvoiceStyles = (config: any) => {
    const isBW = config.theme === 'bw';
    const is3x3 = config.grid === '3x3';
    
    return `
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; font-size: ${is3x3 ? '9px' : '11px'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .a4-page { width: 190mm; height: 277mm; margin: 0 auto; display: grid; grid-template-columns: ${is3x3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; grid-template-rows: repeat(3, 1fr); gap: 10mm; box-sizing: border-box; page-break-after: always; }
      .a4-page:last-child { page-break-after: auto; }
      .invoice-page { width: 100%; height: 100%; box-sizing: border-box; border: ${isBW ? '1px solid #000' : '1px dashed #ccc'}; display: flex; flex-direction: column; overflow: hidden; background: #fff; }
      
      .header { background: ${isBW ? '#fff' : 'linear-gradient(135deg, #0ea5e9, #10b981)'}; color: ${isBW ? '#000' : '#fff'}; border-bottom: ${isBW ? '2px solid #000' : 'none'}; padding: ${is3x3 ? '6px 8px' : '8px 12px'}; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { margin: 0; font-size: ${is3x3 ? '12px' : '14px'}; font-weight: 800; }
      .header p { margin: 2px 0 0; font-size: ${is3x3 ? '8px' : '9px'}; opacity: 0.9; }
      .invoice-badge { background: ${isBW ? '#fff' : 'rgba(255,255,255,0.2)'}; border: ${isBW ? '1px solid #000' : 'none'}; padding: 2px 6px; border-radius: ${isBW ? '0' : '10px'}; font-weight: bold; font-size: ${is3x3 ? '8px' : '9px'}; color: ${isBW ? '#000' : '#fff'}; display: ${config.courierPosition === 'top-right' ? 'block' : 'inline-block'}; }
      .top-courier-id { margin-bottom: 4px; font-size: ${is3x3 ? '10px' : '12px'}; font-weight: 900; border: ${isBW ? '1px solid #000' : 'none'}; background: ${isBW ? '#000' : 'rgba(255,255,255,0.2)'}; color: #fff; padding: 2px 6px; border-radius: 4px; display: inline-block; }
      
      .details-box { display: flex; justify-content: space-between; border-bottom: 1px solid ${isBW ? '#000' : '#e4e4e7'}; padding: ${is3x3 ? '4px 6px' : '6px 10px'}; background: ${isBW ? '#fff' : '#fafafa'}; }
      .box-seller { width: 45%; display: ${config.showSellerAddress ? 'block' : 'none'}; }
      .box-customer { width: ${config.showSellerAddress ? '50%' : '100%'}; border-left: ${config.showSellerAddress ? (isBW ? '1px solid #000' : '2px solid #10b981') : 'none'}; padding-left: ${config.showSellerAddress ? '6px' : '0'}; }
      .box-title { font-size: ${is3x3 ? '8px' : '9px'}; color: ${isBW ? '#000' : '#71717a'}; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
      .box-text { font-size: ${is3x3 ? '9px' : '10px'}; margin: 1px 0; font-weight: 600; }
      .address-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: ${is3x3 ? '8px' : '9.5px'}; margin-top: 2px; color: ${isBW ? '#000' : '#52525b'}; line-height: 1.25; }
      
      .table-container { padding: 0 6px; flex-grow: 1; overflow: hidden; min-height: 0; }
      .table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      .table th { border-bottom: 1px solid ${isBW ? '#000' : '#e4e4e7'}; padding: 2px 0; text-align: left; font-size: ${is3x3 ? '8px' : '9px'}; color: ${isBW ? '#000' : '#71717a'}; text-transform: uppercase; }
      .table td { border-bottom: 1px dashed ${isBW ? '#000' : '#e4e4e7'}; padding: 4px 0; font-size: ${is3x3 ? '9px' : '10px'}; font-weight: 600; }
      
      .summary { margin-top: auto; padding: ${is3x3 ? '4px 6px' : '6px 10px'}; border-top: 1px solid ${isBW ? '#000' : '#e4e4e7'}; flex-shrink: 0; }
      .summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: ${is3x3 ? '9px' : '10px'}; color: ${isBW ? '#000' : '#52525b'}; }
      .total-row { background: ${isBW ? '#000' : '#18181b'}; color: white; padding: 4px 6px; border-radius: ${isBW ? '0' : '4px'}; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: ${is3x3 ? '10px' : '12px'}; margin-top: 4px; }
      
      .courier-info { text-align: center; background: ${isBW ? '#fff' : '#f4f4f5'}; padding: 4px; margin: 4px 6px 6px; border-radius: 4px; font-size: ${is3x3 ? '9px' : '10px'}; font-weight: bold; border: ${isBW ? '1px solid #000' : '1px dashed #d4d4d8'}; flex-shrink: 0; }
      
      @media screen {
        body { background: #52525b; padding: 20mm 0; }
        .a4-page { background: #fff; padding: 10mm; box-shadow: 0 10px 25px rgba(0,0,0,0.3); margin-bottom: 20mm; }
      }
    </style>
  `};

  const generateInvoiceHTML = (o: OrderItem, config: any) => {
    const subtotal = o.amount;
    const delivery = o.deliveryCharge;
    const total = subtotal + delivery;
    const isBW = config.theme === 'bw';

    return `
      <div class="invoice-page">
        <div class="header">
          <div>
            <h1>BondhuMart</h1>
            <p>Trusted Online Shop</p>
          </div>
          <div style="text-align: right;">
            ${config.courierPosition === 'top-right' && o.consignmentId ? `
              <div class="top-courier-id">ID: ${o.consignmentId}</div>
            ` : ''}
            <div class="invoice-badge">INVOICE #${o.id.slice(-6)}</div>
          </div>
        </div>
        
        <div class="details-box">
          <div class="box-seller">
            <div class="box-title">Seller</div>
            <div class="box-text">BondhuMart</div>
            <div class="box-text" style="color: ${isBW ? '#000' : '#52525b'}; font-size: 11px; margin-top: 4px;">Dhaka, Bangladesh</div>
          </div>
          <div class="box-customer">
            <div class="box-title">Customer</div>
            <div class="box-text">${o.customerName}</div>
            ${config.showCustomerPhone ? `<div class="box-text" style="color: ${isBW ? '#000' : '#0ea5e9'};">📞 ${o.phone}</div>` : ''}
            <div class="address-text">${o.address} ${o.district ? ', ' + o.district : ''}</div>
          </div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${o.product}</td>
                <td style="text-align: center;">${o.quantity}</td>
                <td style="text-align: right;">৳ ${subtotal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>৳ ${subtotal}</span></div>
          <div class="summary-row"><span>Delivery Charge</span><span>৳ ${delivery}</span></div>
          <div class="total-row"><span>TOTAL (COD)</span><span style="color: ${isBW ? '#fff' : '#10b981'};">৳ ${total}</span></div>
        </div>

        ${config.courierPosition === 'bottom' && o.consignmentId ? `
        <div class="courier-info">
          Courier: ${o.courierName?.toUpperCase()} | ID: ${o.consignmentId}
        </div>` : ''}
      </div>
    `;
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    const config = getInvoiceConfig();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups to print invoices.');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${selectedOrder.id}</title>
        ${getInvoiceStyles(config)}
      </head>
      <body>
        <div class="a4-page">
          ${generateInvoiceHTML(selectedOrder, config)}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    const config = getInvoiceConfig();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups to print invoices.');

    const selectedOrdersData = orders.filter(o => selectedIds.includes(o.id));

    // Chunk orders into groups based on grid layout (9 for 3x3, 6 for 2x3)
    const itemsPerPage = config.grid === '3x3' ? 9 : 6;
    const chunks = [];
    for (let i = 0; i < selectedOrdersData.length; i += itemsPerPage) {
      chunks.push(selectedOrdersData.slice(i, i + itemsPerPage));
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Invoice Print (${selectedOrdersData.length})</title>
        ${getInvoiceStyles(config)}
      </head>
      <body>
        ${chunks.map(chunk => `
          <div class="a4-page">
            ${chunk.map(o => generateInvoiceHTML(o, config)).join('')}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  const deleteSingleOrder = (id: string) => {
    if (confirm('আপনি কি এই অর্ডারটি ডিলিট করতে চান?')) {
      const updated = orders.filter(o => o.id !== id)
      saveOrders(updated)
      setIsEditModalOpen(false)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!')
    if (confirm(`আপনি কি নিশ্চিত যে ${selectedIds.length} টি অর্ডার ডিলিট করতে চান?`)) {
      const updated = orders.filter(o => !selectedIds.includes(o.id))
      saveOrders(updated)
      setSelectedIds([])
    }
  }

  const moveToConfirmed = () => {
    if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!')
    const updated = orders.map(o => selectedIds.includes(o.id) ? { ...o, status: 'confirmed' as const } : o)
    saveOrders(updated)
    setSelectedIds([])
  }

  const sendToCourier = () => {
    if (selectedIds.length === 0) return alert('অর্ডার সিলেক্ট করুন!')
    setShowCourierModal(true)
  }

  const confirmCourierEntry = async () => {
    if (selectedCourier === 'pathao') {
      try {
        const courierConfigRaw = localStorage.getItem('bondhu_courier_config')
        let pathaoConfig = null;
        if (courierConfigRaw) {
          const config = JSON.parse(courierConfigRaw)
          pathaoConfig = config.couriers?.find((c: any) => c.id === 'pathao')
        }

        if (!pathaoConfig || !pathaoConfig.isActive || !pathaoConfig.apiKey) {
          return alert('Pathao API Key (Access Token) সেট করা নেই! Courier Auto-Entry পেজ থেকে সেটআপ করুন।')
        }

        setIsSending(true)

        const ordersToSend = orders.filter(o => selectedIds.includes(o.id))

        const res = await fetch('/api/courier/pathao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: pathaoConfig.apiKey,
            secretKey: pathaoConfig.secretKey, // Used for store_id fallback
            baseUrl: pathaoConfig.baseUrl,
            orders: ordersToSend
          })
        })

        const data = await res.json()

        if (data.success) {
          const updated = orders.map(o => {
            if (selectedIds.includes(o.id)) {
              const apiResult = data.results.find((r: any) => r.orderId === o.id)
              if (apiResult && apiResult.status === 'success') {
                return {
                  ...o,
                  status: 'shipped' as const,
                  courierName: selectedCourier,
                  trackingNo: apiResult.tracking_code,
                  consignmentId: apiResult.consignment_id,
                  shippedAt: new Date().toISOString(),
                  phone: formatPhoneForCourier(o.phone)
                }
              }
            }
            return o
          })
          saveOrders(updated)
          setSelectedIds([])
          setShowCourierModal(false)

          let msg = `✅ ${data.processed} টি অর্ডার Pathao কুরিয়ারে সফলভাবে এন্ট্রি হয়েছে!`
          if (data.failed > 0) {
            msg += `\n❌ ${data.failed} টি অর্ডার ফেইল করেছে।`
          }
          alert(msg)
        } else {
          alert(`❌ Error: ${data.error}`)
        }
      } catch (err) {
        alert('Internal error occurred while communicating with Pathao API.')
        console.error(err)
      } finally {
        setIsSending(false)
      }
      return;
    }

    if (selectedCourier !== 'steadfast' && selectedCourier !== 'pathao') {
      // Mock for others currently
      const updated = orders.map(o => {
        if (selectedIds.includes(o.id)) {
          return {
            ...o,
            status: 'shipped' as const,
            courierName: selectedCourier,
            trackingNo: 'TRK-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            shippedAt: new Date().toISOString(),
            phone: formatPhoneForCourier(o.phone)
          }
        }
        return o
      })
      saveOrders(updated)
      setSelectedIds([])
      setShowCourierModal(false)
      alert(`✅ ${selectedIds.length} টি অর্ডার ${selectedCourier} কুরিয়ারে সফলভাবে এন্ট্রি হয়েছে (Mocked)!`)
      return;
    }

    // Steadfast API Integration
    try {
      const courierConfigRaw = localStorage.getItem('bondhu_courier_config')
      let steadfastConfig = null;
      if (courierConfigRaw) {
        const config = JSON.parse(courierConfigRaw)
        steadfastConfig = config.couriers?.find((c: any) => c.id === 'steadfast')
      }

      if (!steadfastConfig || !steadfastConfig.isActive || !steadfastConfig.apiKey || !steadfastConfig.secretKey) {
        return alert('Steadfast API Key / Secret Key সেট করা নেই! Courier Auto-Entry পেজ থেকে সেটআপ করুন।')
      }

      setIsSending(true)

      const ordersToSend = orders.filter(o => selectedIds.includes(o.id))

      const res = await fetch('/api/courier/steadfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: steadfastConfig.apiKey,
          secretKey: steadfastConfig.secretKey,
          orders: ordersToSend
        })
      })

      const data = await res.json()

      if (data.success) {
        const updated = orders.map(o => {
          if (selectedIds.includes(o.id)) {
            // Find tracking number from API results
            const apiResult = data.results.find((r: any) => r.orderId === o.id)
            if (apiResult && apiResult.status === 'success') {
              return {
                ...o,
                status: 'shipped' as const,
                courierName: selectedCourier,
                trackingNo: apiResult.tracking_code || 'STDF-' + Date.now(),
                consignmentId: apiResult.consignment_id,
                shippedAt: new Date().toISOString(),
                phone: formatPhoneForCourier(o.phone)
              }
            }
          }
          return o
        })
        saveOrders(updated)
        setSelectedIds([])
        setShowCourierModal(false)

        let msg = `✅ ${data.processed} টি অর্ডার Steadfast কুরিয়ারে সফলভাবে এন্ট্রি হয়েছে!`
        if (data.failed > 0) {
          const firstError = data.errors[0]?.error || 'Unknown Error';
          msg += `\n❌ ${data.failed} টি অর্ডার ফেইল করেছে।\n\n[Steadfast Error]: ${firstError}`
          console.error(data.errors)
        }
        alert(msg)
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (err) {
      alert('Internal error occurred while communicating with courier API.')
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  const newCount = orders.filter(o => o.status === 'new').length
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length
  const shippedCount = orders.filter(o => o.status === 'shipped').length
  const deliveredCount = orders.filter(o => o.status === 'delivered').length
  const returnedCount = orders.filter(o => o.status === 'returned').length
  const returnedReceivedCount = orders.filter(o => o.status === 'returned_received').length

  const courierList = [
    { id: 'steadfast', name: 'Steadfast Courier', color: 'text-blue-400' },
    { id: 'pathao', name: 'Pathao Courier', color: 'text-rose-400' },
    { id: 'redx', name: 'RedX Courier', color: 'text-red-400' },
    { id: 'paperfly', name: 'Paperfly', color: 'text-amber-400' }
  ]

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-zinc-100 bg-black min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-500" /> Orders Management
          </h2>
          <p className="text-zinc-400 mt-1">Manage orders from Broadcast & Website. Auto courier entry system.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Add Order
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
            <Upload className="h-4 w-4" /> Import Excel/CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800">
        <button onClick={() => { setActiveTab('new'); setSelectedIds([]) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Package className="h-4 w-4" /> New <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">{newCount}</span>
        </button>
        <button onClick={() => { setActiveTab('confirmed'); setSelectedIds([]) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'confirmed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <CheckCircle2 className="h-4 w-4" /> Confirmed <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">{confirmedCount}</span>
        </button>
        <button onClick={() => { setActiveTab('shipped'); setSelectedIds([]) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'shipped' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Truck className="h-4 w-4" /> Shipped <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full">{shippedCount}</span>
        </button>
        <button onClick={() => { setActiveTab('delivered'); setSelectedIds([]) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Package className="h-4 w-4" /> Delivered <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">{deliveredCount}</span>
        </button>
        <button onClick={() => { setActiveTab('returned'); setSelectedIds([]) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'returned' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <X className="h-4 w-4" /> Returned <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full">{returnedCount}</span>
        </button>
        <button onClick={() => { setActiveTab('returned_received'); setSelectedIds([]) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'returned_received' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Package className="h-4 w-4" /> Ret. Received <span className="bg-fuchsia-500/20 text-fuchsia-400 text-xs px-2 py-0.5 rounded-full">{returnedReceivedCount}</span>
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or product..." className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkPrint} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg">
              <Package className="h-4 w-4" /> Bulk Print ({selectedIds.length})
            </button>
          )}
          {selectedIds.length > 0 && (
            <button onClick={handleDeleteSelected} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95">
              <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
            </button>
          )}
          {activeTab === 'new' && selectedIds.length > 0 && (
            <button onClick={moveToConfirmed} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-500/20">
              <CheckCircle2 className="h-4 w-4" /> Confirm Selected ({selectedIds.length})
            </button>
          )}
          {activeTab === 'confirmed' && selectedIds.length > 0 && (
            <button onClick={sendToCourier} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
              <Truck className="h-4 w-4" /> Send to Courier ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-4 w-12"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={selectAll} className="accent-blue-500 w-4 h-4 cursor-pointer" /></th>
                <th className="px-4 py-4 font-medium whitespace-nowrap">Order ID</th>
                <th className="px-4 py-4 font-medium">Customer</th>
                <th className="px-4 py-4 font-medium">Product</th>
                <th className="px-4 py-4 font-medium">Amount</th>
                <th className="px-4 py-4 font-medium">Source</th>
                {['shipped', 'delivered', 'returned', 'returned_received'].includes(activeTab) && <th className="px-4 py-4 font-medium">Courier</th>}
                {['shipped', 'delivered', 'returned', 'returned_received'].includes(activeTab) && <th className="px-4 py-4 font-medium">Tracking</th>}
                <th className="px-4 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length > 0 ? filtered.map(o => (
                <tr key={o.id} onClick={() => openEditModal(o)} className="cursor-pointer hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} className="accent-blue-500 w-4 h-4 cursor-pointer" /></td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs whitespace-nowrap">{o.id.slice(0, 12)}</td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <div className="text-zinc-200 font-medium group-hover:text-blue-400 transition-colors">{o.customerName}</div>
                    <div className="text-zinc-500 text-xs font-mono mt-0.5">{o.phone}</div>
                    <div className="text-zinc-600 text-xs truncate max-w-[200px] mt-0.5">{o.address}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <span className="font-medium">{o.product}</span> <span className="text-zinc-500">x{o.quantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-emerald-400 font-medium">৳{o.amount}</div>
                    <div className="text-zinc-500 text-xs">Del: ৳{o.deliveryCharge}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${o.source === 'Website Import' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : o.source === 'Manual' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {o.source}
                    </span>
                  </td>
                  {['shipped', 'delivered', 'returned', 'returned_received'].includes(activeTab) && <td className="px-4 py-3 capitalize text-zinc-300 font-medium">{o.courierName}</td>}
                  {['shipped', 'delivered', 'returned', 'returned_received'].includes(activeTab) && <td className="px-4 py-3 font-mono text-xs text-blue-400">{o.trackingNo}</td>}
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={10} className="px-6 py-24 text-center text-zinc-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium text-zinc-400">
                      {activeTab === 'new' ? 'No new orders right now.' : activeTab === 'confirmed' ? 'No confirmed orders.' : 'No shipped orders yet.'}
                    </p>
                    <p className="text-sm mt-1">
                      {activeTab === 'new' ? 'Wait for broadcasts or manually add one.' : activeTab === 'confirmed' ? 'Import from Excel or confirm new ones.' : 'Send confirmed orders to courier.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Excel/CSV Import Modal (2 Steps) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#1a1a1a]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-500" /> Import Confirmed Orders
              </h3>
              <button onClick={() => { setIsUploadModalOpen(false); setUploadStep(1); setParsedData([]) }} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {uploadStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm">
                    <strong>Step 1:</strong> Upload your CSV or Excel (.xlsx) file containing confirmed website orders. You can map columns in the next step.
                  </div>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-12 cursor-pointer transition-colors bg-zinc-900/50 group">
                    <Upload className="h-10 w-10 text-zinc-500 group-hover:text-emerald-500 mb-4 transition-colors" />
                    <span className="text-zinc-300 font-medium text-lg">Click to Upload File</span>
                    <span className="text-zinc-500 text-sm mt-2">Supports .csv, .xls, .xlsx</span>
                    <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                  </label>

                  {parsedData.length > 0 && (
                    <div className="flex justify-end">
                      <button onClick={() => setUploadStep(2)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all">
                        Map Columns <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {uploadStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-400 text-sm">
                    <strong>Step 2:</strong> Map your file's columns to BondhuOS order fields. Unmapped fields will be left blank.
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-800 text-zinc-400 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 w-1/3">Required Field</th>
                          <th className="px-4 py-3">Your Excel Column</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {[
                          { key: 'name', label: 'Customer Name' },
                          { key: 'phone', label: 'Phone Number (Crucial)' },
                          { key: 'address', label: 'Full Address' },
                          { key: 'district', label: 'District/City' },
                          { key: 'product', label: 'Product Name' },
                          { key: 'quantity', label: 'Quantity' },
                          { key: 'amount', label: 'Total Amount (৳)' },
                          { key: 'delivery', label: 'Delivery Charge (৳)' },
                        ].map(field => (
                          <tr key={field.key} className="hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-medium text-zinc-300">{field.label}</td>
                            <td className="px-4 py-3">
                              <select
                                value={colMap[field.key as keyof typeof colMap]}
                                onChange={e => setColMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                              >
                                <option value="">-- Ignore --</option>
                                {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between mt-6">
                    <button onClick={() => setUploadStep(1)} className="text-zinc-400 hover:text-white px-4 py-2 font-medium">Back</button>
                    <button onClick={handleProcessMappedData} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4" /> Import {parsedData.length} Orders
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Courier Selection Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Truck className="h-5 w-5 text-emerald-500" /> Select Courier</h3><button onClick={() => setShowCourierModal(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="p-6 space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-400 text-xs mb-4">
                Phone numbers will automatically have <b>+88</b> stripped and properly formatted for courier APIs.
              </div>
              <p className="text-sm text-zinc-400 mb-4">{selectedIds.length} টি অর্ডার কুরিয়ারে পাঠানো হবে। কুরিয়ার সিলেক্ট করুন:</p>
              {courierList.map(c => (
                <button key={c.id} onClick={() => setSelectedCourier(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedCourier === c.id ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-zinc-800 hover:bg-zinc-900'}`}>
                  <Truck className={`h-5 w-5 ${c.color}`} />
                  <span className={`font-medium text-sm ${selectedCourier === c.id ? 'text-emerald-400' : 'text-zinc-300'}`}>{c.name}</span>
                  {selectedCourier === c.id && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
                </button>
              ))}
            </div>
            <div className="p-5 border-t border-zinc-800 flex gap-3 justify-end">
              <button onClick={() => setShowCourierModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white" disabled={isSending}>Cancel</button>
              <button onClick={confirmCourierEntry} disabled={isSending} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                <Truck className="h-4 w-4" /> {isSending ? 'Sending to Steadfast...' : 'Confirm & Auto-Ship'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="h-5 w-5 text-blue-500" /> Add New Order</h3><button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-zinc-400 mb-1">Customer Name *</label><input value={nName} onChange={e => setNName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Phone *</label><input value={nPhone} onChange={e => setNPhone(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div><label className="block text-xs text-zinc-400 mb-1">Address</label><input value={nAddress} onChange={e => setNAddress(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-zinc-400 mb-1">District</label><input value={nDistrict} onChange={e => setNDistrict(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Product *</label><input value={nProduct} onChange={e => setNProduct(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs text-zinc-400 mb-1">Qty</label><input type="number" value={nQty} onChange={e => setNQty(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Amount (৳) *</label><input type="number" value={nAmount} onChange={e => setNAmount(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Delivery (৳)</label><input type="number" value={nDelivery} onChange={e => setNDelivery(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800 flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={handleAddOrder} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium">Add Order</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">Order Details & Edit</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-zinc-500 font-mono">ID: {selectedOrder.id}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full ${selectedOrder.status === 'new' ? 'bg-amber-500/10 text-amber-400' : selectedOrder.status === 'confirmed' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {selectedOrder.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-zinc-400 mb-1">Customer Name *</label><input value={eName} onChange={e => setEName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Phone *</label><input value={ePhone} onChange={e => setEPhone(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div><label className="block text-xs text-zinc-400 mb-1">Address</label><input value={eAddress} onChange={e => setEAddress(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-zinc-400 mb-1">District</label><input value={eDistrict} onChange={e => setEDistrict(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Product *</label><input value={eProduct} onChange={e => setEProduct(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs text-zinc-400 mb-1">Qty</label><input type="number" value={eQty} onChange={e => setEQty(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Amount (৳) *</label><input type="number" value={eAmount} onChange={e => setEAmount(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Delivery (৳)</label><input type="number" value={eDelivery} onChange={e => setEDelivery(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
              </div>

              {['shipped', 'delivered', 'returned', 'returned_received'].includes(selectedOrder.status) && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-1">Courier Details</p>
                    <p className="text-sm text-zinc-300 capitalize">Courier: {selectedOrder.courierName}</p>
                    <p className="text-sm text-zinc-300">Tracking No: <span className="font-mono text-blue-400">{selectedOrder.trackingNo}</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-1">Courier ID</p>
                    <p className="text-sm text-zinc-300 font-mono">{selectedOrder.consignmentId || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-zinc-800 flex justify-between items-center">
              <button onClick={() => deleteSingleOrder(selectedOrder.id)} className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete Order
              </button>
              <div className="flex gap-2">
                <button onClick={handlePrintInvoice} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Print Invoice
                </button>
                <button onClick={saveEditedOrder} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
