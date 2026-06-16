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
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-xl">
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
