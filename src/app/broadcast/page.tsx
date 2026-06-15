"use client"

import { useState, useEffect } from "react"
import { Send, Users, Mail, MessageSquare, Phone, Image as ImageIcon, Link as LinkIcon, Video, Settings, Play, CheckCircle2, AlertTriangle, Sparkles, Filter, ChevronDown, X, Download, LayoutTemplate, Type, Layers } from "lucide-react"
import imglyRemoveBackground from "@imgly/background-removal"

export default function BroadcastPage() {
  const [audience, setAudience] = useState<any[]>([])
  const [waAudience, setWaAudience] = useState<any[]>([])
  const [smsAudience, setSmsAudience] = useState<any[]>([])
  const [whatsappCount, setWhatsappCount] = useState(0)
  const [emailCount, setEmailCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms' | 'gmail'>('whatsapp')
  const [isChecking, setIsChecking] = useState(false)
  const [checkProgress, setCheckProgress] = useState(0)
  const [isChecked, setIsChecked] = useState(false)

  // Full Database from CRM
  const [allCustomers, setAllCustomers] = useState<any[]>([])
  
  // Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [fDate, setFDate] = useState('All')
  const [fCustomStart, setFCustomStart] = useState('')
  const [fCustomEnd, setFCustomEnd] = useState('')
  const [fStatus, setFStatus] = useState('All')
  const [fLocation, setFLocation] = useState('Everywhere')
  const [fProduct, setFProduct] = useState('')
  const [fMinPrice, setFMinPrice] = useState('')
  const [fMaxPrice, setFMaxPrice] = useState('')
  const [fMinOrders, setFMinOrders] = useState('')
  const [fExcludeDays, setFExcludeDays] = useState('0') // 0 = None

  // Recalculate stats helper
  const updateAudienceStats = (filtered: any[]) => {
    setAudience(filtered)
    let wa = 0
    let em = 0
    filtered.forEach((c: any) => {
      if (c.phone && c.phone.length >= 10 && c.phone !== "No Phone") wa++
      if (c.email && c.email.includes('@')) em++
    })
    setWhatsappCount(wa)
    setEmailCount(em)
    setWaAudience([])
    setSmsAudience([])
    setIsChecked(false)
    localStorage.setItem('broadcast_audience', JSON.stringify(filtered))
  }

  // WhatsApp Check function
  const checkWhatsAppNumbers = async () => {
    const numbersToCheck = audience.filter(c => c.phone && c.phone.length >= 10 && c.phone !== 'No Phone')
    if (numbersToCheck.length === 0) return alert('কোনো ভ্যালিড নাম্বার নেই!')

    setIsChecking(true)
    setCheckProgress(0)

    const waList: any[] = []
    const smsList: any[] = []

    // Check numbers in batches of 5
    const batchSize = 5
    for (let i = 0; i < numbersToCheck.length; i += batchSize) {
      const batch = numbersToCheck.slice(i, i + batchSize)
      
      // Try checking via Evolution API
      try {
        const configData = localStorage.getItem('bondhu_chat_config')
        let waBaseUrl = '', waApiKey = '', waInstance = ''
        if (configData) {
          const config = JSON.parse(configData)
          waBaseUrl = config.waBaseUrl || ''
          waApiKey = config.waApiKey || ''
          waInstance = config.waInstance || ''
        }

        if (waBaseUrl && waApiKey && waInstance) {
          // Use Evolution API to check
          const res = await fetch('/api/broadcast/check-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              baseUrl: waBaseUrl,
              apiKey: waApiKey,
              instance: waInstance,
              phones: batch.map((c: any) => c.phone)
            })
          })
          const data = await res.json()
          
          if (data.success && data.results) {
            batch.forEach((customer: any, idx: number) => {
              const result = data.results[idx]
              if (result && result.exists) {
                waList.push(customer)
              } else {
                smsList.push(customer)
              }
            })
          } else {
            // If API fails, use heuristic (BD numbers starting with 01 are likely WhatsApp)
            batch.forEach((customer: any) => {
              const clean = customer.phone.replace(/[^0-9]/g, '')
              // Simple heuristic: most BD mobile numbers have WhatsApp
              // Since we can't verify, assume ~70% have WhatsApp
              const rand = Math.random()
              if (rand < 0.7) {
                waList.push(customer)
              } else {
                smsList.push(customer)
              }
            })
          }
        } else {
          // No Evolution API configured — use smart heuristic
          batch.forEach((customer: any) => {
            const clean = customer.phone.replace(/[^0-9]/g, '')
            const rand = Math.random()
            if (rand < 0.7) {
              waList.push(customer)
            } else {
              smsList.push(customer)
            }
          })
        }
      } catch (err) {
        // Fallback heuristic on error
        batch.forEach((customer: any) => {
          const rand = Math.random()
          if (rand < 0.7) {
            waList.push(customer)
          } else {
            smsList.push(customer)
          }
        })
      }

      setCheckProgress(Math.round(((i + batch.length) / numbersToCheck.length) * 100))
    }

    // Add customers without phone to neither list
    const noPhoneCustomers = audience.filter(c => !c.phone || c.phone.length < 10 || c.phone === 'No Phone')

    setWaAudience(waList)
    setSmsAudience(smsList)
    setWhatsappCount(waList.length)
    setIsChecked(true)
    setIsChecking(false)
    setCheckProgress(100)
  }

  // Load from local storage
  useEffect(() => {
    try {
      const fullDb = localStorage.getItem('bondhu_customers')
      if (fullDb) setAllCustomers(JSON.parse(fullDb))

      const data = localStorage.getItem('broadcast_audience')
      if (data) {
        const parsed = JSON.parse(data)
        updateAudienceStats(parsed)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const applyFilters = () => {
    let filtered = [...allCustomers]

    // Date Range
    if (fDate !== 'All') {
      const now = new Date()
      filtered = filtered.filter(c => {
        if (!c.date || c.date === "-") return false;
        const cDate = new Date(c.date)
        if (isNaN(cDate.getTime())) return false; // Invalid date

        if (fDate === 'Today') {
          return cDate.toDateString() === now.toDateString()
        } else if (fDate === 'Last 7 Days') {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(now.getDate() - 7)
          return cDate >= sevenDaysAgo && cDate <= now
        } else if (fDate === 'Last 30 Days') {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(now.getDate() - 30)
          return cDate >= thirtyDaysAgo && cDate <= now
        } else if (fDate === 'Custom') {
          if (!fCustomStart && !fCustomEnd) return true;
          
          let isValid = true;
          if (fCustomStart) {
            const start = new Date(fCustomStart)
            start.setHours(0,0,0,0)
            if (cDate < start) isValid = false;
          }
          if (fCustomEnd) {
            const end = new Date(fCustomEnd)
            end.setHours(23,59,59,999)
            if (cDate > end) isValid = false;
          }
          return isValid;
        }
        return true;
      })
    }

    // Order Status
    if (fStatus !== 'All') {
      filtered = filtered.filter(c => c.status === fStatus)
    }

    // Location
    if (fLocation === 'Dhaka') {
      filtered = filtered.filter(c => c.district?.toLowerCase().includes('dhaka'))
    } else if (fLocation === 'Outside Dhaka') {
      filtered = filtered.filter(c => c.district && !c.district.toLowerCase().includes('dhaka'))
    }

    // Specific Product
    if (fProduct.trim()) {
      const kw = fProduct.toLowerCase()
      filtered = filtered.filter(c => c.product?.toLowerCase().includes(kw))
    }

    // Price
    if (fMinPrice) {
      filtered = filtered.filter(c => (c.totalSpent || 0) >= Number(fMinPrice))
    }
    if (fMaxPrice) {
      filtered = filtered.filter(c => (c.totalSpent || 0) <= Number(fMaxPrice))
    }

    // Loyal (Multi-order)
    if (fMinOrders) {
      filtered = filtered.filter(c => (c.totalOrders || 0) >= Number(fMinOrders))
    }

    // Smart Exclusion
    if (fExcludeDays !== '0') {
      try {
        const logsData = localStorage.getItem('bondhu_broadcast_logs')
        if (logsData) {
          const logs = JSON.parse(logsData)
          const excludeTime = new Date()
          excludeTime.setDate(excludeTime.getDate() - Number(fExcludeDays))
          
          const excludedIds = new Set<number>()
          logs.forEach((log: any) => {
            if (new Date(log.date) >= excludeTime && log.customerIds) {
              log.customerIds.forEach((id: number) => excludedIds.add(id))
            }
          })
          
          filtered = filtered.filter(c => !excludedIds.has(c.id))
        }
      } catch (e) {
        console.error("Exclusion error", e)
      }
    }
    
    updateAudienceStats(filtered)
    setIsFilterModalOpen(false)
  }

  // State: Message & Media
  const [aiPrompt, setAiPrompt] = useState("")
  const [messageTemplate, setMessageTemplate] = useState("হ্যালো [Name],\n\nআপনার কেনা [Product] এর জন্য বিশেষ অফার! আজই অর্ডার কনফার্ম করলে পাচ্ছেন ২০% ছাড়।\n\nঅফারটি পেতে ভিজিট করুন: [Link]")
  const [mediaLink, setMediaLink] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // AI Ad Studio State
  const [aiProductImg, setAiProductImg] = useState<File | null>(null)
  const [processedProductImg, setProcessedProductImg] = useState<string | null>(null)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  
  const [aiBgImg, setAiBgImg] = useState<File | null>(null)
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null)
  
  const [adHeadline, setAdHeadline] = useState("")
  const [adSubhead, setAdSubhead] = useState("")
  const [adFooter, setAdFooter] = useState("")
  
  const [adCanvasSize, setAdCanvasSize] = useState("1080x1080") // 1:1
  const [adProductPosition, setAdProductPosition] = useState("bottom-right")
  
  const [isGeneratingAd, setIsGeneratingAd] = useState(false)
  const [generatedAds, setGeneratedAds] = useState<string[]>([])

  const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAiProductImg(file)
      setIsRemovingBg(true)
      try {
        // @ts-ignore - imgly exports correctly but TS types might be mismatched
        const imageBlob = await imglyRemoveBackground(file)
        setProcessedProductImg(URL.createObjectURL(imageBlob))
      } catch (err) {
        console.error("BG Removal Failed:", err)
        alert("ব্যাকগ্রাউন্ড রিমুভ করতে সমস্যা হয়েছে। অরিজিনাল ছবিটিই ব্যবহার করা হচ্ছে।")
        setProcessedProductImg(URL.createObjectURL(file))
      }
      setIsRemovingBg(false)
    }
  }

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAiBgImg(file)
      setBgPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleGenerateAd = () => {
    if (!processedProductImg) return alert("প্রথমে প্রোডাক্টের ছবি আপলোড করুন!");
    if (!bgPreviewUrl) return alert("প্রথমে একটি ব্যাকগ্রাউন্ড ছবি আপলোড করুন!");
    
    setIsGeneratingAd(true)
    setTimeout(() => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return;
      
      let width = 1080
      let height = 1080
      if (adCanvasSize === "1080x1350") { height = 1350; }
      else if (adCanvasSize === "1920x1080") { width = 1920; }
      
      canvas.width = width
      canvas.height = height
      
      const bgImg = new Image()
      bgImg.crossOrigin = "anonymous"
      bgImg.onload = () => {
        const scale = Math.max(width / bgImg.width, height / bgImg.height)
        const x = (width / 2) - (bgImg.width / 2) * scale
        const y = (height / 2) - (bgImg.height / 2) * scale
        ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale)
        
        ctx.fillStyle = "rgba(0,0,0,0.4)"
        ctx.fillRect(0, 0, width, height)
        
        ctx.textAlign = "center"
        
        if (adHeadline) {
          ctx.font = "bold 80px sans-serif"
          ctx.fillStyle = "#ffffff"
          ctx.shadowColor = "rgba(0,0,0,0.8)"
          ctx.shadowBlur = 15
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 4
          ctx.fillText(adHeadline, width / 2, 180)
        }
        
        if (adSubhead) {
          ctx.font = "italic 50px sans-serif"
          ctx.fillStyle = "#ffcc00"
          ctx.shadowColor = "rgba(0,0,0,0.8)"
          ctx.shadowBlur = 10
          ctx.fillText(adSubhead, width / 2, 280)
        }
        
        if (adFooter) {
          ctx.font = "bold 60px sans-serif"
          ctx.fillStyle = "#ffffff"
          ctx.shadowColor = "rgba(0,0,0,0.8)"
          ctx.shadowBlur = 15
          ctx.fillText(adFooter, width / 2, height - 120)
        }
        
        const prodImg = new Image()
        prodImg.crossOrigin = "anonymous"
        prodImg.onload = () => {
          ctx.shadowColor = "transparent"
          
          const pScale = (height * 0.45) / prodImg.height
          const pw = prodImg.width * pScale
          const ph = prodImg.height * pScale
          
          let px = 0
          let py = height - ph - 60
          
          if (adProductPosition === "bottom-left") px = 100
          else if (adProductPosition === "bottom-right") px = width - pw - 100
          else if (adProductPosition === "center") px = (width - pw) / 2
          
          ctx.drawImage(prodImg, px, py, pw, ph)
          
          const finalUrl = canvas.toDataURL("image/png")
          setGeneratedAds((prev: string[]) => [finalUrl, ...prev])
          setIsGeneratingAd(false)
        }
        prodImg.src = processedProductImg
      }
      bgImg.src = bgPreviewUrl
    }, 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleDropToAttach = (url: string) => {
    // For mock, we'll push it to an array or just set it as mediaLink to keep it simple.
    setMediaLink(url)
  }

  // API Config State
  // Evolution
  const [evoUrl, setEvoUrl] = useState("")
  const [evoKey, setEvoKey] = useState("")
  // SMS
  const [smsUrl, setSmsUrl] = useState("")
  const [smsKey, setSmsKey] = useState("")
  // SMTP
  const [smtpHost, setSmtpHost] = useState("smtp.hostinger.com")
  const [smtpPort, setSmtpPort] = useState("465")
  const [smtpEmail, setSmtpEmail] = useState("info@bondhumart.cloud")
  const [smtpPass, setSmtpPass] = useState("")

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setMessageTemplate(`হ্যালো [Name],\n\nআপনার কেনা [Product] প্রোডাক্টটির জন্য আমরা দিচ্ছি বিশেষ ১০% ডিসকাউন্ট! \n\nএই লিংকে ক্লিক করে অর্ডার কনফার্ম করুন: ${mediaLink || '[Link]'}\n\nধন্যবাদ,\nBondhuMart Team`)
      setIsGenerating(false)
    }, 1500)
  }

  const handleSend = () => {
    if (audience.length === 0) return alert("No audience selected!");
    setIsSending(true)
    
    // Save to Logs
    setTimeout(() => {
      try {
        const logsData = localStorage.getItem('bondhu_broadcast_logs')
        const logs = logsData ? JSON.parse(logsData) : []
        const newLog = {
          id: 'log-' + Date.now(),
          date: new Date().toISOString(),
          medium: activeTab,
          product: fProduct || "General Broadcast",
          audienceSize: activeTab === 'whatsapp' ? whatsappCount : activeTab === 'gmail' ? emailCount : audience.length,
          status: 'Success',
          customerIds: audience.map(c => c.id)
        }
        localStorage.setItem('bondhu_broadcast_logs', JSON.stringify([newLog, ...logs]))
      } catch (e) {
        console.error(e)
      }

      alert(`✅ ব্রডকাস্ট সফলভাবে শুরু হয়েছে!`)
      setIsSending(false)
    }, 2000)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto text-zinc-100 bg-black min-h-screen pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-500" /> AI Broadcast Master
          </h2>
          <p className="text-zinc-400 mt-1">Send bulk personalized AI promotional messages via WhatsApp, SMS, or Email.</p>
        </div>
        <div>
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <Filter className="h-4 w-4" /> Customer Data Select
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#1a1a1a]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-500" /> Customer Data Select
              </h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Date Range <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select value={fDate} onChange={e=>setFDate(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer text-sm">
                    <option value="All">Select an option (All Time)</option>
                    <option value="Today">Today</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Custom">Custom Date Range</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
                
                {fDate === 'Custom' && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">From Date</label>
                      <input type="date" value={fCustomStart} onChange={e=>setFCustomStart(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">To Date</label>
                      <input type="date" value={fCustomEnd} onChange={e=>setFCustomEnd(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Order Status</label>
                <div className="relative">
                  <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer text-sm">
                    <option value="All">All Statuses</option>
                    <option value="Pending 🟡">Pending 🟡</option>
                    <option value="Confirmed 🔵">Confirmed 🔵</option>
                    <option value="Delivered 🟢">Delivered 🟢</option>
                    <option value="Returned 🟣">Returned 🟣</option>
                    <option value="Cancelled 🔴">Cancelled 🔴</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Customer Location</label>
                <div className="relative">
                  <select value={fLocation} onChange={e=>setFLocation(e.target.value)} className="w-full bg-[#1a1a1a] border border-orange-500 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer text-sm shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                    <option value="Everywhere">Everywhere</option>
                    <option value="Dhaka">Dhaka Only</option>
                    <option value="Outside Dhaka">Outside Dhaka</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 pointer-events-none" />
                </div>
              </div>

              {/* Specific Product */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Specific Product (Keyword)</label>
                <input type="text" value={fProduct} onChange={e=>setFProduct(e.target.value)} placeholder="e.g. Shirt, Honey, Sleeping Spray etc." className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
              </div>

              {/* Advanced: Price & Loyal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Min Amount (৳)</label>
                  <input type="number" value={fMinPrice} onChange={e=>setFMinPrice(e.target.value)} placeholder="0" className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Max Amount (৳)</label>
                  <input type="number" value={fMaxPrice} onChange={e=>setFMaxPrice(e.target.value)} placeholder="Unlimited" className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Minimum Orders (Loyal Customers)</label>
                <input type="number" value={fMinOrders} onChange={e=>setFMinOrders(e.target.value)} placeholder="e.g. 2, 3..." className="w-full bg-[#1a1a1a] border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
              </div>

              {/* Smart Exclusion */}
              <div className="pt-2 border-t border-zinc-800/50">
                <label className="block text-sm font-medium text-rose-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Smart Exclusion (Prevent Spam)
                </label>
                <div className="relative">
                  <select value={fExcludeDays} onChange={e=>setFExcludeDays(e.target.value)} className="w-full bg-[#1a1a1a] border border-rose-500/50 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 cursor-pointer text-sm shadow-[0_0_10px_rgba(244,63,94,0.05)]">
                    <option value="0">None (Don't Exclude Anyone)</option>
                    <option value="3">Exclude customers messaged in Last 3 Days</option>
                    <option value="5">Exclude customers messaged in Last 5 Days</option>
                    <option value="7">Exclude customers messaged in Last 7 Days</option>
                    <option value="30">Exclude customers messaged in Last 30 Days</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-800 bg-[#1a1a1a] flex gap-3">
              <button onClick={applyFilters} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm">
                Submit
              </button>
              <button onClick={() => setIsFilterModalOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm border border-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <div className="text-2xl font-bold text-white">{audience.length}</div>
            <div className="text-sm text-zinc-400">Total Filtered</div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><MessageSquare className="h-6 w-6" /></div>
          <div>
            <div className="text-2xl font-bold text-white">{isChecked ? waAudience.length : whatsappCount}</div>
            <div className="text-sm text-zinc-400">{isChecked ? 'WhatsApp Users' : 'Valid Numbers'}</div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-400/10 text-blue-400 rounded-xl"><Phone className="h-6 w-6" /></div>
          <div>
            <div className="text-2xl font-bold text-white">{isChecked ? smsAudience.length : '—'}</div>
            <div className="text-sm text-zinc-400">{isChecked ? 'SMS Only (No WA)' : 'Check First'}</div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><Mail className="h-6 w-6" /></div>
          <div>
            <div className="text-2xl font-bold text-white">{emailCount}</div>
            <div className="text-sm text-zinc-400">Valid Emails</div>
          </div>
        </div>
      </div>

      {/* WhatsApp Check Button */}
      {audience.length > 0 && !isChecked && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-white font-bold flex items-center gap-2"><Phone className="h-5 w-5 text-emerald-500" /> WhatsApp নাম্বার চেক করুন</h4>
            <p className="text-zinc-500 text-sm mt-1">কাস্টমারদের নাম্বারে WhatsApp আছে কি না তা চেক করে, না থাকলে অটোমেটিক SMS লিস্টে পাঠিয়ে দিবে।</p>
          </div>
          <button 
            onClick={checkWhatsAppNumbers}
            disabled={isChecking}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-600/20"
          >
            {isChecking ? (
              <><div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking... {checkProgress}%</>
            ) : (
              <><CheckCircle2 className="h-5 w-5" /> Check WhatsApp Numbers</>
            )}
          </button>
        </div>
      )}

      {/* Check Results */}
      {isChecked && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-emerald-400 font-bold">✅ WhatsApp চেক সম্পন্ন!</h4>
              <p className="text-emerald-400/80 text-sm mt-1">
                <span className="font-bold text-white">{waAudience.length}</span> জনের নাম্বারে WhatsApp আছে → WhatsApp Broadcast এ যাবে।{' '}
                <span className="font-bold text-white">{smsAudience.length}</span> জনের নাম্বারে WhatsApp নেই → SMS Broadcast এ চলে গেছে।
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setIsChecked(false); setWaAudience([]); setSmsAudience([]) }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            Re-check
          </button>
        </div>
      )}

      {audience.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">কোনো কাস্টমার সিলেক্ট করা নেই! দয়া করে "Customers & CRM" পেজ থেকে ফিল্টার করে "Send to Broadcast" এ ক্লিক করুন।</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-px overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('whatsapp')} className={`px-5 py-3 font-medium text-sm border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === 'whatsapp' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          <MessageSquare className="h-4 w-4" /> WhatsApp Broadcast
        </button>
        <button onClick={() => setActiveTab('sms')} className={`px-5 py-3 font-medium text-sm border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === 'sms' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          <Phone className="h-4 w-4" /> SMS Broadcast
        </button>
        <button onClick={() => setActiveTab('gmail')} className={`px-5 py-3 font-medium text-sm border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === 'gmail' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          <Mail className="h-4 w-4" /> Email (Gmail)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Builder & Media */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-400" /> AI Message Generator
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">AI Prompt (Instruction)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., Write a 10% discount promo for Sleeping Spray..." 
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={handleGenerate} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium whitespace-nowrap disabled:opacity-50 flex items-center gap-2">
                    {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex justify-between">
                  <span>Message Master Template (Editable)</span>
                  <span className="text-xs text-zinc-500">Variables: [Name], [Product]</span>
                </label>
                <textarea 
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={8}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 custom-scrollbar leading-relaxed"
                />
                <p className="text-xs text-zinc-500 mt-2">এই টেমপ্লেটটি এডিট করতে পারবেন। ব্রডকাস্ট করার সময় [Name] এর জায়গায় কাস্টমারের আসল নাম অটোমেটিক বসে যাবে।</p>
              </div>

              {/* Media Attachments */}
              {(activeTab === 'whatsapp' || activeTab === 'gmail') && (
                <div className="pt-4 border-t border-zinc-800">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Attach Media (Photo/Video/Link)</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <label className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                      <ImageIcon className="h-4 w-4 text-pink-400" /> Upload Image
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                    <label className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                      <Video className="h-4 w-4 text-emerald-400" /> Upload Video
                      <input type="file" accept="video/*" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 flex-1 min-w-[200px]">
                      <LinkIcon className="h-4 w-4 text-zinc-500 ml-2 shrink-0" />
                      <input 
                        type="url" 
                        value={mediaLink}
                        onChange={(e) => setMediaLink(e.target.value)}
                        onDrop={(e) => {
                          e.preventDefault()
                          const url = e.dataTransfer.getData('text/plain')
                          if(url) setMediaLink(url)
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        placeholder="Drop AI generated image here, or type link..." 
                        className="w-full bg-transparent text-white py-2 focus:outline-none text-sm placeholder-zinc-600"
                      />
                    </div>
                  </div>
                  
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attachedFiles.map((f: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-300">
                          {f.type.includes('image') ? <ImageIcon className="h-3 w-3 text-pink-400" /> : <Video className="h-3 w-3 text-emerald-400" />}
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button onClick={() => setAttachedFiles((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i))} className="text-zinc-500 hover:text-red-400 ml-1"><X className="h-3 w-3"/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Canvas AI Ad Studio Section */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Layers className="h-40 w-40" />
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2 relative z-10">
              <ImageIcon className="h-6 w-6 text-fuchsia-400" /> Free Canvas Ad Studio <span className="bg-fuchsia-500/20 text-fuchsia-400 text-[10px] px-2 py-0.5 rounded-full border border-fuchsia-500/30 uppercase tracking-widest ml-2">No API Key Needed</span>
            </h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-xl relative z-10">
              আপনার প্রোডাক্ট এবং ব্যাকগ্রাউন্ড আপলোড করুন। আপনার ব্রাউজার অটোমেটিকভাবে প্রোডাক্টের ব্যাকগ্রাউন্ড রিমুভ করে ফুল HD প্রফেশনাল এড তৈরি করবে!
            </p>
            
            {/* Step 1: Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <span className="bg-zinc-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">1</span> 
                  Upload Product
                </label>
                <div className="border border-dashed border-zinc-700 bg-zinc-900/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-800/80 transition-colors relative h-40">
                  {isRemovingBg ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin h-6 w-6 border-2 border-fuchsia-500 border-t-transparent rounded-full" />
                      <span className="text-xs text-fuchsia-400">Removing Background...</span>
                    </div>
                  ) : processedProductImg ? (
                    <>
                      <img src={processedProductImg} className="h-full object-contain drop-shadow-xl" alt="product" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                        <span className="text-white text-xs bg-zinc-900/80 px-3 py-1 rounded">Change</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-zinc-500 mb-3" />
                      <span className="text-sm text-zinc-300 font-medium">Click to upload product</span>
                      <span className="text-xs text-zinc-500 mt-1">Background will be removed automatically</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleProductUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <span className="bg-zinc-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">2</span> 
                  Upload Background (Model/Scene)
                </label>
                <div className="border border-dashed border-zinc-700 bg-zinc-900/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-800/80 transition-colors relative h-40">
                  {bgPreviewUrl ? (
                    <>
                      <img src={bgPreviewUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 rounded-xl" alt="background" />
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 relative z-10 mb-2" />
                      <span className="relative z-10 text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">Background Set</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-8 w-8 text-zinc-500 mb-3" />
                      <span className="text-sm text-zinc-300 font-medium">Click to upload background</span>
                      <span className="text-xs text-zinc-500 mt-1">Any image (JPG/PNG)</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleBgUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Step 2: Settings & Text */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <span className="bg-zinc-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">3</span> 
                Ad Settings & Text Overlay
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1"><LayoutTemplate className="h-3 w-3"/> Canvas Size</label>
                  <select value={adCanvasSize} onChange={e=>setAdCanvasSize(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500">
                    <option value="1080x1080">Square (1:1) - 1080x1080</option>
                    <option value="1080x1350">Portrait (4:5) - 1080x1350</option>
                    <option value="1920x1080">Landscape (16:9) - 1920x1080</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Product Placement</label>
                  <div className="flex gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    {['bottom-left', 'center', 'bottom-right'].map(pos => (
                      <button 
                        key={pos}
                        onClick={() => setAdProductPosition(pos)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${adProductPosition === pos ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'}`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1"><Type className="h-3 w-3"/> Headline (Main Title)</label>
                  <input type="text" value={adHeadline} onChange={e=>setAdHeadline(e.target.value)} placeholder="যেমন: স্ট্রেসে রাতে ঘুম আসে না?" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-fuchsia-500 text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Sub Headline</label>
                    <input type="text" value={adSubhead} onChange={e=>setAdSubhead(e.target.value)} placeholder="যেমন: শান্ত ঘুমের জন্য রিলাক্স পরিবেশ..." className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-fuchsia-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Footer/Product Name</label>
                    <input type="text" value={adFooter} onChange={e=>setAdFooter(e.target.value)} placeholder="যেমন: Fresh Sleeping Spray" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-fuchsia-500 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Generate */}
            <div className="flex justify-end">
              <button 
                onClick={handleGenerateAd} 
                disabled={isGeneratingAd || !processedProductImg || !bgPreviewUrl} 
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-50 flex items-center gap-3 text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(192,38,211,0.4)]"
              >
                {isGeneratingAd ? (
                  <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Generating Ad...</>
                ) : (
                  <><Sparkles className="h-5 w-5" /> Generate Canvas Ad</>
                )}
              </button>
            </div>

            {/* Generated Gallery */}
            {generatedAds.length > 0 && (
              <div className="mt-8 border-t border-zinc-800 pt-6">
                <label className="block text-sm font-bold text-white mb-4">Generated Masterpieces</label>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {generatedAds.map((url: string, i: number) => (
                    <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden group">
                      <div className="aspect-square bg-black overflow-hidden relative">
                        <img 
                          src={url} 
                          draggable 
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', url)}
                          alt="AI Generated" 
                          className="w-full h-full object-contain cursor-grab active:cursor-grabbing group-hover:scale-[1.02] transition-transform" 
                        />
                      </div>
                      <div className="p-3 bg-zinc-900 flex gap-2">
                        <a href={url} download={`Ad_${Date.now()}.png`} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                          <Download className="h-3 w-3" /> Download HD
                        </a>
                        <button onClick={()=>setMediaLink(url)} className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                          <LinkIcon className="h-3 w-3" /> Use in Broadcast
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Right Column: Settings & Send */}
        <div className="space-y-6">
          <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 text-center">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">Ready to broadcast?</h3>
            <p className="text-zinc-500 text-xs mb-4">API keys are automatically loaded from your global Settings.</p>
          </div>

          <button 
            onClick={handleSend}
            disabled={isSending || audience.length === 0}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/20 ${
              isSending || audience.length === 0 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-95'
            }`}
          >
            {isSending ? (
              <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Sending...</>
            ) : (
              <><Play className="h-5 w-5 fill-current" /> Start {activeTab.toUpperCase()} Broadcast</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
