"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  MessageSquare, 
  Send,
  History,
  Truck,
  BookOpen,
  Settings,
  BarChart3
} from "lucide-react"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ads Analytics', href: '/ads', icon: BarChart3 },
  { name: 'Customers & CRM', href: '/customers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Fraud Check & History', href: '/history', icon: History },
  { name: 'Live AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'AI Broadcast', href: '/broadcast', icon: Send },
  { name: 'Broadcast Logs', href: '/broadcast-logs', icon: History },
  { name: 'AI Training Center', href: '/ai-training', icon: BookOpen },
  { name: 'Courier Auto-Entry', href: '/courier', icon: Truck },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'Invoice Builder', href: '/invoice-builder', icon: Settings },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          BondhuOS AI
        </h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Mobile Navigation ----------
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Top 4 items for bottom bar
  const mainNav = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Ads', href: '/ads', icon: BarChart3 },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Broadcast', href: '/broadcast', icon: Send },
  ]

  // Everything else goes to "More"
  const moreNav = navigation.filter(n => !mainNav.find(m => m.href === n.href))

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 z-50 px-2 flex items-center justify-around pb-safe">
        {mainNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full tap-highlight-transparent"
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-primary/20" : "bg-transparent"
              )}>
                <item.icon
                  className={cn(
                    "h-[22px] w-[22px] transition-colors",
                    isActive ? "text-primary" : "text-zinc-500"
                  )}
                  aria-hidden="true"
                />
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium transition-colors",
                isActive ? "text-primary" : "text-zinc-500"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center w-16 h-full tap-highlight-transparent"
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-all duration-300",
            isMoreOpen ? "bg-primary/20" : "bg-transparent"
          )}>
            <Menu
              className={cn(
                "h-[22px] w-[22px] transition-colors",
                isMoreOpen ? "text-primary" : "text-zinc-500"
              )}
            />
          </div>
          <span className={cn(
            "text-[10px] mt-1 font-medium transition-colors",
            isMoreOpen ? "text-primary" : "text-zinc-500"
          )}>
            More
          </span>
        </button>
      </div>

      {/* More Bottom Sheet */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMoreOpen(false)}
          />
          
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto pb-8 hide-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {moreNav.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-start gap-3 p-4 rounded-2xl border transition-colors tap-highlight-transparent",
                        isActive 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-zinc-900 border-zinc-800/50 active:bg-zinc-800"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-6 w-6",
                          isActive ? "text-primary" : "text-zinc-400"
                        )}
                      />
                      <span className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-primary" : "text-zinc-300"
                      )}>
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
