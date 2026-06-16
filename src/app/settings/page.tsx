"use client"

import { useState, useEffect } from "react"
import { Settings, MessageSquare, Phone, Save, CheckCircle2, Copy, AlertTriangle, Link as LinkIcon, BarChart3 } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('messenger')
  const [saved, setSaved] = useState(false)

  // Facebook Messenger State
  const [fbPageId, setFbPageId] = useState('')
  const [fbAccessToken, setFbAccessToken] = useState('')
  const [fbVerifyToken, setFbVerifyToken] = useState('bondhu_os_secure_token_2026')
  const webhookUrl = 'https://command.bondhumart.cloud/api/webhook/messenger'

  // WhatsApp State
  const [waInstance, setWaInstance] = useState('')
  const [waApiKey, setWaApiKey] = useState('')
  const [waBaseUrl, setWaBaseUrl] = useState('')

  // SMS State
  const [smsUrl, setSmsUrl] = useState('')
  const [smsKey, setSmsKey] = useState('')

  // Email State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpEmail, setSmtpEmail] = useState('')
  const [smtpPass, setSmtpPass] = useState('')

  // FB Ads State
  const [fbAdAccountId, setFbAdAccountId] = useState('')
  const [fbAdAccessToken, setFbAdAccessToken] = useState('')

  useEffect(() => {
    try {
      const data = localStorage.getItem('bondhu_chat_config')
      if (data) {
        const parsed = JSON.parse(data)
        setFbPageId(parsed.fbPageId || '')
        setFbAccessToken(parsed.fbAccessToken || '')
        setWaInstance(parsed.waInstance || '')
        setWaApiKey(parsed.waApiKey || '')
        setWaBaseUrl(parsed.waBaseUrl || '')
        setSmsUrl(parsed.smsUrl || '')
        setSmsKey(parsed.smsKey || '')
        setSmtpHost(parsed.smtpHost || 'smtp.gmail.com')
        setSmtpPort(parsed.smtpPort || '587')
        setSmtpEmail(parsed.smtpEmail || '')
        setSmtpPass(parsed.smtpPass || '')
        setFbAdAccountId(parsed.fbAdAccountId || '')
        setFbAdAccessToken(parsed.fbAdAccessToken || '')
      }
    } catch(e) {}
  }, [])

  const handleSave = () => {
    localStorage.setItem('bondhu_chat_config', JSON.stringify({
      fbPageId, fbAccessToken, waInstance, waApiKey, waBaseUrl,
      smsUrl, smsKey, smtpHost, smtpPort, smtpEmail, smtpPass,
      fbAdAccountId, fbAdAccessToken
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto text-zinc-100 bg-black min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-500" /> API & Integrations
          </h2>
          <p className="text-zinc-400 mt-1">Connect your Facebook Page and WhatsApp API to the Live AI Chat.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20">
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 pb-2 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('messenger')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'messenger' ? 'bg-[#0084FF]/20 text-[#0084FF]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
        >
          <MessageSquare className="h-4 w-4" /> Facebook Messenger
        </button>
        <button 
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'whatsapp' ? 'bg-[#25D366]/20 text-[#25D366]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
        >
          <Phone className="h-4 w-4" /> WhatsApp (Evolution API)
        </button>
        <button 
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'sms' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
        >
          <MessageSquare className="h-4 w-4" /> Custom SMS Gateway
        </button>
        <button 
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'email' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
        >
          <MessageSquare className="h-4 w-4" /> Email (SMTP/Gmail)
        </button>
        <button 
          onClick={() => setActiveTab('fbads')} 
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'fbads' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
        >
          <BarChart3 className="h-4 w-4" /> Facebook Ads
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'messenger' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-[#0084FF]/20 to-transparent p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-[#0084FF]" /> Messenger Configuration
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                To connect your Facebook Page, you need to create an app in the Meta Developer Portal, set up the Webhook, and generate a Page Access Token.
              </p>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Facebook Page ID</label>
                  <input 
                    type="text" 
                    value={fbPageId} 
                    onChange={e => setFbPageId(e.target.value)} 
                    placeholder="e.g. 1029384756102" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0084FF]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Page Access Token</label>
                  <input 
                    type="password" 
                    value={fbAccessToken} 
                    onChange={e => setFbAccessToken(e.target.value)} 
                    placeholder="EAABw..." 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0084FF]" 
                  />
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-zinc-400" /> Webhook Setup Info</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Callback URL (Webhook)</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black border border-zinc-800 text-emerald-400 rounded-lg px-4 py-3 text-sm">{webhookUrl}</code>
                      <button onClick={() => copyToClipboard(webhookUrl)} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Verify Token</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black border border-zinc-800 text-blue-400 rounded-lg px-4 py-3 text-sm">{fbVerifyToken}</code>
                      <button onClick={() => copyToClipboard(fbVerifyToken)} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-[#0084FF]/10 border border-[#0084FF]/20 rounded-lg p-3">
                  <p className="text-xs text-[#0084FF] font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Copy these and paste them into your Meta App Webhook configuration. Don't forget to subscribe to "messages" and "messaging_postbacks" events!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-[#25D366]/20 to-transparent p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Phone className="h-6 w-6 text-[#25D366]" /> WhatsApp Configuration
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                Connect your WhatsApp number using Evolution API or WAApi to send and receive messages automatically.
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Base URL</label>
                <input 
                  type="text" 
                  value={waBaseUrl} 
                  onChange={e => setWaBaseUrl(e.target.value)} 
                  placeholder="https://api.yourdomain.com" 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#25D366]" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Instance Name</label>
                  <input 
                    type="text" 
                    value={waInstance} 
                    onChange={e => setWaInstance(e.target.value)} 
                    placeholder="e.g. bondhu-wa-01" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#25D366]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Global API Key</label>
                  <input 
                    type="password" 
                    value={waApiKey} 
                    onChange={e => setWaApiKey(e.target.value)} 
                    placeholder="Enter your Evolution API Key..." 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#25D366]" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-blue-500/20 to-transparent p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-blue-400" /> Custom SMS Gateway
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                Configure your custom SMS gateway provider (e.g. BulkSMS, SMSNen) to send SMS Broadcasts.
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">API Endpoint URL</label>
                <input 
                  type="text" 
                  value={smsUrl} 
                  onChange={e => setSmsUrl(e.target.value)} 
                  placeholder="https://sms-provider.com/api/send" 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">API Key / Token</label>
                <input 
                  type="password" 
                  value={smsKey} 
                  onChange={e => setSmsKey(e.target.value)} 
                  placeholder="Enter your SMS API Key..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-purple-500/20 to-transparent p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-400" /> Email SMTP Configuration
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                Connect your Gmail or Webmail SMTP server to send mass promotional emails to your customers. (For Gmail, use App Password).
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">SMTP Host</label>
                  <input 
                    type="text" 
                    value={smtpHost} 
                    onChange={e => setSmtpHost(e.target.value)} 
                    placeholder="smtp.gmail.com" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">SMTP Port</label>
                  <input 
                    type="text" 
                    value={smtpPort} 
                    onChange={e => setSmtpPort(e.target.value)} 
                    placeholder="587" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={smtpEmail} 
                    onChange={e => setSmtpEmail(e.target.value)} 
                    placeholder="yourname@gmail.com" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">App Password / SMTP Password</label>
                  <input 
                    type="password" 
                    value={smtpPass} 
                    onChange={e => setSmtpPass(e.target.value)} 
                    placeholder="Enter App Password..." 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fbads' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-orange-500/20 to-transparent p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-orange-400" /> Facebook Ads Analytics
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                Configure your Meta Ads Account ID and System User Access Token to fetch campaign performance, ROAS, and demographic insights into your dashboard.
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Ad Account ID (Format: act_xxxxxxxx)</label>
                <input 
                  type="text" 
                  value={fbAdAccountId} 
                  onChange={e => setFbAdAccountId(e.target.value)} 
                  placeholder="act_1234567890" 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">System User Access Token (Requires ads_read, read_insights)</label>
                <input 
                  type="password" 
                  value={fbAdAccessToken} 
                  onChange={e => setFbAdAccessToken(e.target.value)} 
                  placeholder="EAABxxxxxxxxxxxxxxxxxxxx..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
