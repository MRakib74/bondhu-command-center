"use client"

import { useState, useEffect } from "react"
import { Save, Settings2, CheckCircle2, LayoutGrid, Palette, Truck, FileText } from "lucide-react"

export default function InvoiceBuilderPage() {
  const [config, setConfig] = useState({
    theme: 'bw', // bw, color
    grid: '3x3', // 3x3 (9 per page), 2x3 (6 per page)
    courierPosition: 'top-right', // top-right, bottom
    showSellerAddress: true,
    showCustomerPhone: true
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedConfig = localStorage.getItem('bondhu_invoice_config')
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (e) {}
    }
  }, [])

  const saveConfig = () => {
    localStorage.setItem('bondhu_invoice_config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white">
            <Settings2 className="h-7 w-7 text-blue-500" />
            Invoice Builder
          </h2>
          <p className="text-zinc-400 mt-2 text-sm">Design your invoice format. Changes will apply to all future printed invoices.</p>
        </div>
        <button 
          onClick={saveConfig}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          {saved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          {saved ? 'Saved!' : 'Save Layout'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6">
            
            {/* Theme */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <Palette className="h-4 w-4 text-pink-500" /> Theme Color
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig('theme', 'bw')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.theme === 'bw' ? 'bg-zinc-100 text-black border-zinc-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                >
                  Black & White
                </button>
                <button
                  onClick={() => updateConfig('theme', 'color')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.theme === 'color' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                >
                  Colorful
                </button>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <LayoutGrid className="h-4 w-4 text-emerald-500" /> A4 Paper Grid
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig('grid', '3x3')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.grid === '3x3' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                >
                  3x3 (9 per page)
                </button>
                <button
                  onClick={() => updateConfig('grid', '2x3')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.grid === '2x3' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                >
                  2x3 (6 per page)
                </button>
              </div>
            </div>

            {/* Courier ID Position */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <Truck className="h-4 w-4 text-orange-500" /> Courier ID Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig('courierPosition', 'top-right')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.courierPosition === 'top-right' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                >
                  Top Right
                </button>
                <button
                  onClick={() => updateConfig('courierPosition', 'bottom')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.courierPosition === 'bottom' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                >
                  Bottom Footer
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <FileText className="h-4 w-4 text-purple-500" /> Elements
              </label>
              <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
                <span className="text-sm font-medium text-zinc-300">Show Seller Address</span>
                <input 
                  type="checkbox" 
                  checked={config.showSellerAddress}
                  onChange={(e) => updateConfig('showSellerAddress', e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer" 
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
                <span className="text-sm font-medium text-zinc-300">Show Customer Phone</span>
                <input 
                  type="checkbox" 
                  checked={config.showCustomerPhone}
                  onChange={(e) => updateConfig('showCustomerPhone', e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer" 
                />
              </label>
            </div>

          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-full min-h-[600px] flex items-center justify-center overflow-hidden">
            
            {/* The scaled A4 Preview wrapper */}
            <div 
              className="relative shadow-2xl transition-all duration-300"
              style={{
                width: '190mm',
                height: '277mm',
                transform: 'scale(0.6)',
                transformOrigin: 'center center',
                backgroundColor: '#fff',
                display: 'grid',
                gridTemplateColumns: config.grid === '3x3' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                gridTemplateRows: config.grid === '3x3' ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
                gap: '8mm',
                padding: '8mm'
              }}
            >
              {/* Render one dummy invoice */}
              {Array.from({ length: 1 }).map((_, i) => (
                <DummyInvoice key={i} config={config} />
              ))}
              
              {/* Render wireframes for the rest */}
              {Array.from({ length: (config.grid === '3x3' ? 8 : 5) }).map((_, i) => (
                <div key={i+1} className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-300 font-bold text-xl opacity-50">Invoice Space</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

function DummyInvoice({ config }: { config: any }) {
  const isBW = config.theme === 'bw';
  const is3x3 = config.grid === '3x3';

  return (
    <div 
      style={{
        border: isBW ? '1px solid #000' : '1px dashed #ccc',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fff',
        color: '#000',
        fontFamily: 'sans-serif',
        fontSize: is3x3 ? '9px' : '11px'
      }}
    >
      <div 
        style={{
          background: isBW ? '#fff' : 'linear-gradient(135deg, #0ea5e9, #10b981)',
          color: isBW ? '#000' : '#fff',
          borderBottom: isBW ? '2px solid #000' : 'none',
          padding: is3x3 ? '6px 8px' : '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: is3x3 ? '12px' : '14px', fontWeight: 800 }}>BondhuMart</h1>
          <p style={{ margin: '2px 0 0', fontSize: is3x3 ? '8px' : '9px', opacity: 0.9 }}>Trusted Online Shop</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {config.courierPosition === 'top-right' && (
            <div style={{ 
              marginBottom: '4px', 
              fontSize: is3x3 ? '10px' : '12px', 
              fontWeight: 900,
              border: isBW ? '1px solid #000' : 'none',
              background: isBW ? '#000' : 'rgba(255,255,255,0.2)',
              color: isBW ? '#fff' : '#fff',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              ID: 261536260
            </div>
          )}
          <div style={{
            background: isBW ? '#fff' : 'rgba(255,255,255,0.2)',
            color: isBW ? '#000' : '#fff',
            border: isBW ? '1px solid #000' : 'none',
            padding: '2px 6px',
            borderRadius: isBW ? '0' : '10px',
            fontWeight: 'bold',
            fontSize: is3x3 ? '8px' : '9px',
            display: config.courierPosition === 'top-right' ? 'block' : 'inline-block'
          }}>
            INVOICE #9709-0
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid ' + (isBW ? '#000' : '#e4e4e7'),
        padding: is3x3 ? '4px 6px' : '6px 10px',
        background: isBW ? '#fff' : '#fafafa'
      }}>
        {config.showSellerAddress && (
          <div style={{ width: '45%' }}>
            <div style={{ fontSize: is3x3 ? '8px' : '9px', color: isBW ? '#000' : '#71717a', textTransform: 'uppercase', fontWeight: 'bold' }}>Seller</div>
            <div style={{ fontWeight: 600, fontSize: is3x3 ? '9px' : '10px' }}>BondhuMart</div>
            <div style={{ color: isBW ? '#000' : '#52525b', fontSize: is3x3 ? '8px' : '9px', marginTop: '2px' }}>Dhaka, Bangladesh</div>
          </div>
        )}
        <div style={{ 
          width: config.showSellerAddress ? '50%' : '100%',
          borderLeft: config.showSellerAddress ? (isBW ? '1px solid #000' : '2px solid #10b981') : 'none',
          paddingLeft: config.showSellerAddress ? '6px' : '0'
        }}>
          <div style={{ fontSize: is3x3 ? '8px' : '9px', color: isBW ? '#000' : '#71717a', textTransform: 'uppercase', fontWeight: 'bold' }}>Customer</div>
          <div style={{ fontWeight: 600, fontSize: is3x3 ? '9px' : '10px' }}>Akash</div>
          {config.showCustomerPhone && (
            <div style={{ color: isBW ? '#000' : '#0ea5e9', fontWeight: 'bold' }}>📞 01823927411</div>
          )}
          <div style={{ fontSize: is3x3 ? '8px' : '9.5px', marginTop: '2px', lineHeight: 1.25 }}>মীর ফিলিং স্টেশন, নতুন ব্রীজ, বাকলিয়া, চট্টগ্রাম</div>
        </div>
      </div>

      <div style={{ padding: '0 6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid ' + (isBW?'#000':'#e4e4e7'), textAlign: 'left', fontSize: is3x3?'8px':'9px' }}>PRODUCT</th>
              <th style={{ borderBottom: '1px solid ' + (isBW?'#000':'#e4e4e7'), textAlign: 'center', fontSize: is3x3?'8px':'9px' }}>QTY</th>
              <th style={{ borderBottom: '1px solid ' + (isBW?'#000':'#e4e4e7'), textAlign: 'right', fontSize: is3x3?'8px':'9px' }}>PRICE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ borderBottom: '1px dashed ' + (isBW?'#000':'#e4e4e7'), padding: '4px 0', fontSize: is3x3?'9px':'10px', fontWeight: 600 }}>Fresh Sleeping Spray (x1)</td>
              <td style={{ borderBottom: '1px dashed ' + (isBW?'#000':'#e4e4e7'), textAlign: 'center', padding: '4px 0' }}>1</td>
              <td style={{ borderBottom: '1px dashed ' + (isBW?'#000':'#e4e4e7'), textAlign: 'right', padding: '4px 0' }}>৳ 990</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ padding: is3x3 ? '2px 6px' : '4px 10px', borderTop: '1px solid ' + (isBW?'#000':'#e4e4e7') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is3x3?'9px':'10px', fontWeight: 'bold' }}><span>Subtotal</span><span>৳ 990</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is3x3?'9px':'10px', fontWeight: 'bold', margin: '1px 0' }}><span>Delivery</span><span>৳ 0</span></div>
        <div style={{ 
          background: isBW ? '#000' : '#18181b', 
          color: '#fff', 
          padding: '4px 6px', 
          borderRadius: isBW ? '0' : '4px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: 'bold', 
          marginTop: '2px',
          fontSize: is3x3 ? '10px' : '12px'
        }}>
          <span>TOTAL (COD)</span>
          <span style={{ color: isBW ? '#fff' : '#10b981' }}>৳ 990</span>
        </div>
      </div>

      {config.courierPosition === 'bottom' && (
        <div style={{ 
          textAlign: 'center', 
          background: isBW ? '#fff' : '#f4f4f5', 
          padding: '4px', 
          margin: '4px 6px 6px', 
          border: isBW ? '1px solid #000' : '1px dashed #d4d4d8', 
          fontWeight: 'bold',
          fontSize: is3x3 ? '9px' : '10px'
        }}>
          Courier: STEADFAST | ID: 261536260
        </div>
      )}
    </div>
  )
}
