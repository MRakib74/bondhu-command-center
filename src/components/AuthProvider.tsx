"use client"

import { useState, useEffect } from "react"
import { Lock, Mail, Key, ShieldCheck, User } from "lucide-react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Allowed Credentials
  const ADMIN_EMAIL = "rakibraja74@gmail.com"
  const ADMIN_PASS = "rakib531998%"

  useEffect(() => {
    // Check if user is already authenticated in this session
    const authStatus = sessionStorage.getItem("bondhu_auth_status")
    if (authStatus === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate small network delay for UX
    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        sessionStorage.setItem("bondhu_auth_status", "authenticated")
        setIsAuthenticated(true)
      } else {
        setError("Invalid email or password. Please try again.")
      }
      setIsLoading(false)
    }, 800)
  }

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">BondhuOS Access</h1>
            <p className="text-zinc-400 text-sm">Please enter your master credentials to enter the Command Center.</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-white outline-none transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Master Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-white outline-none transition-colors"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>Unlock Dashboard <Key className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
          
          <p className="text-center text-zinc-600 text-xs mt-8">
            Secure connection • BondhuOS © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    )
  }

  // If authenticated, render the dashboard
  return <>{children}</>
}
