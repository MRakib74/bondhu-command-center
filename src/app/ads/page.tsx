"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, ShoppingCart, Users, ChevronDown, Sparkles, AlertTriangle, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b']

export default function AdsAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [datePreset, setDatePreset] = useState("last_7d")
  
  // AI Guidance State
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const configStr = localStorage.getItem('bondhu_chat_config') || '{}'
      const config = JSON.parse(configStr)
      
      if (!config.fbAdAccountId || !config.fbAdAccessToken) {
        setError("Please configure your Meta Ad Account ID and Access Token in Settings first.")
        setIsLoading(false)
        return
      }

      const res = await fetch("/api/ads/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fbAdAccountId: config.fbAdAccountId,
          fbAdAccessToken: config.fbAdAccessToken,
          datePreset
        })
      })

      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setData(json)
      }
    } catch (err) {
      setError("Failed to fetch ads data. Check your network.")
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [datePreset])

  const getAiGuidance = async () => {
    if (!data || !data.campaigns) return;
    
    setShowAiModal(true)
    setIsAiThinking(true)
    setAiAnalysis("")

    try {
      // Fetch Groq API key from local storage
      const aiConfigStr = localStorage.getItem('bondhu_ai_config') || '{}'
      const aiConfig = JSON.parse(aiConfigStr)
      const apiKey = aiConfig.groqKey || process.env.NEXT_PUBLIC_GROQ_API_KEY || "gsk_dummy" // User should have saved this in AI Training

      if (!apiKey) {
        setAiAnalysis("❌ No AI API Key found! Please set up your Groq/OpenAI key in the AI Training Center first.")
        setIsAiThinking(false)
        return
      }

      const prompt = `
You are an expert Facebook Ads Marketer. Analyze the following ad campaign data and provide a concise, actionable, and professional marketing guide in Bengali.
Tell the user which campaigns are doing well, which are wasting money, and what they should do next to improve ROAS.

### DATA METRICS (Last ${datePreset})
Total Spend: $${data.overview.totalSpend.toFixed(2)}
Total Purchases: ${data.overview.totalPurchases}
Overall ROAS: ${data.overview.overallRoas.toFixed(2)}

### CAMPAIGNS BREAKDOWN:
${data.campaigns.map((c: any) => `- ${c.name}: Spend $${c.spend}, Purchases: ${c.purchases}, ROAS: ${c.roas.toFixed(2)}, CPC: $${c.cpc}, CTR: ${c.ctr}%`).join('\n')}

Be encouraging but strict about wasting money. Keep formatting clean with bullet points.
`

      // Call Groq API directly from client (assuming Groq is selected in Training Center)
      // Note: We use Llama-3 model
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      })

      if (res.ok) {
        const result = await res.json()
        setAiAnalysis(result.choices[0].message.content)
      } else {
        const err = await res.json()
        setAiAnalysis(`❌ API Error: ${err.error?.message || 'Failed to analyze'}. If you haven't set a Groq API key in the AI Training Center, please do so.`)
      }

    } catch (err) {
      setAiAnalysis("❌ Error connecting to AI. Please check your internet or API key.")
    }
    setIsAiThinking(false)
  }

  // --- DUMMY FALLBACK DATA (For visualization if token is missing/invalid) ---
  const showDummy = !!error;
  const displayData = data && !error ? data : {
    overview: { totalSpend: 1250.50, totalPurchases: 45, overallRoas: 3.2, totalImpressions: 125000, totalLinkClicks: 3200 },
    campaigns: [
      { id: 1, name: "Sleeping Spray - Broad Audience", spend: 500, purchases: 20, roas: 4.1, cpc: 0.15, ctr: 2.5, cpm: 2.0, pageViews: 1500, addToCart: 80, initiateCheckout: 40 },
      { id: 2, name: "Retargeting - Last 30 Days", spend: 200, purchases: 15, roas: 5.5, cpc: 0.10, ctr: 4.2, cpm: 3.5, pageViews: 800, addToCart: 60, initiateCheckout: 35 },
      { id: 3, name: "Lookalike 1% - Purchasers", spend: 550.5, purchases: 10, roas: 1.8, cpc: 0.25, ctr: 1.5, cpm: 4.0, pageViews: 1200, addToCart: 50, initiateCheckout: 20 }
    ],
    demographics: {
      gender: [{ name: "Male", value: 800 }, { name: "Female", value: 450 }],
      age: [{ age: "18-24", spend: 200 }, { age: "25-34", spend: 650 }, { age: "35-44", spend: 300 }, { age: "45-54", spend: 100 }]
    }
  }

  return (
    <div className="p-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-orange-500" />
            Ads Analytics
          </h2>
          <p className="text-zinc-400 mt-2">Track, analyze, and optimize your Meta Ads performance.</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2.5 outline-none focus:border-orange-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7d">Last 7 Days</option>
            <option value="last_30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
          </select>
          <button 
            onClick={fetchData}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
          <button 
            onClick={getAiGuidance}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Sparkles className="h-5 w-5" /> AI Marketing Guide
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 font-bold text-sm mb-1">Connection Error</h4>
            <p className="text-red-400/80 text-sm">{error}</p>
            <p className="text-zinc-500 text-xs mt-2 italic">Showing dummy preview data below to demonstrate the layout.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="h-20 w-20" /></div>
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Amount Spent</h3>
          <p className="text-3xl font-black text-white">${displayData.overview.totalSpend.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><ShoppingCart className="h-20 w-20" /></div>
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Purchases</h3>
          <p className="text-3xl font-black text-white">{displayData.overview.totalPurchases}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-20 w-20" /></div>
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Overall ROAS</h3>
          <p className={`text-3xl font-black ${displayData.overview.overallRoas >= 3 ? 'text-emerald-400' : displayData.overview.overallRoas >= 2 ? 'text-orange-400' : 'text-red-400'}`}>
            {displayData.overview.overallRoas.toFixed(2)}x
          </p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><MousePointerClick className="h-20 w-20" /></div>
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Link Clicks</h3>
          <p className="text-3xl font-black text-white">{displayData.overview.totalLinkClicks}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Age Breakdown */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Spend by Age Group</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.demographics.age} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="age" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  cursor={{fill: '#27272a', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Bar dataKey="spend" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Spend by Gender</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData.demographics.gender}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {displayData.demographics.gender.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">Campaign Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Campaign Name</th>
                <th className="px-6 py-4 font-semibold">Spend</th>
                <th className="px-6 py-4 font-semibold">Purchases</th>
                <th className="px-6 py-4 font-semibold">ROAS</th>
                <th className="px-6 py-4 font-semibold">CTR</th>
                <th className="px-6 py-4 font-semibold">CPC</th>
                <th className="px-6 py-4 font-semibold">Cost per Pur.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {displayData.campaigns.map((camp: any) => (
                <tr key={camp.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{camp.name}</td>
                  <td className="px-6 py-4 text-zinc-300">${camp.spend.toFixed(2)}</td>
                  <td className="px-6 py-4 text-zinc-300">{camp.purchases}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${camp.roas >= 3 ? 'bg-emerald-500/10 text-emerald-400' : camp.roas >= 2 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
                      {camp.roas.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{camp.ctr.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-zinc-300">${camp.cpc.toFixed(2)}</td>
                  <td className="px-6 py-4 text-zinc-300">${camp.purchases > 0 ? (camp.spend / camp.purchases).toFixed(2) : '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Guidance Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-900/40 to-transparent">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-400" /> AI Marketing Guide
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <BarChart3 className="h-5 w-5 rotate-45" /> {/* Use as X icon approximation or stick to standard X if imported */}
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isAiThinking ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                  <div className="relative">
                    <div className="animate-ping absolute inset-0 bg-blue-500 rounded-full opacity-20"></div>
                    <Bot className="h-12 w-12 text-blue-500 relative z-10" />
                  </div>
                  <p className="text-zinc-400 font-medium animate-pulse">Analyzing your ad campaigns...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-li:text-zinc-300">
                  <div className="whitespace-pre-wrap text-[15px]">{aiAnalysis}</div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-center">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function Bot(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
}
