"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  Home, 
  Package, 
  PenTool, 
  Video, 
  Image as ImageIcon,
  Users, 
  Send, 
  BarChart, 
  Settings,
  User,
  Link2,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "🔗 Bondhumart", href: "/bondhumart", icon: Link2 },
  { name: "Products", href: "/products", icon: Package },
  { name: "Latest Products (Live)", href: "/products/latest", icon: Package },
  { name: "Orders", href: "/orders", icon: BarChart },
  { name: "Content AI", href: "/content", icon: PenTool },
  { name: "Image AI", href: "/images", icon: ImageIcon },
  { name: "Video AI", href: "/video", icon: Video },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Broadcast", href: "/broadcast", icon: Send },
  { name: "Admin Panel", href: "/admin", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-slate-50/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-slate-900">
              <span className="text-2xl">🤖</span> BondhuOS
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
              <NavLinks />
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
          <Sheet open={open} onOpenChange={setOpen}>
            {/* @ts-ignore */}
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center gap-2 font-semibold text-lg mb-6">
                <span className="text-2xl">🤖</span> BondhuOS
              </div>
              <nav className="grid gap-2 text-lg font-medium">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:hidden">BondhuOS AI Center</h1>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
