"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, RefreshCw, Box, Tag, DollarSign, Activity } from "lucide-react";

export default function LatestProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Production-এ /api proxy হয়ে ব্যাকএন্ডে যাবে (Next.js rewrites এর মাধ্যমে)
      const res = await fetch("/api/v1/live/products?limit=100");
      if (!res.ok) throw new Error("সার্ভার থেকে প্রোডাক্ট আনতে সমস্যা হয়েছে।");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="text-blue-500" /> BondhuMart লাইভ প্রোডাক্টস
          </h1>
          <p className="text-muted-foreground mt-2">
            এই প্রোডাক্টগুলো সরাসরি আপনার মেইন সাইট (BondhuMart) থেকে রিয়েল-টাইমে আসছে। AI এই ডেটা ব্যবহার করে কাস্টমারদের রিপ্লাই দেবে।
          </p>
        </div>
        <Button onClick={fetchProducts} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "রিফ্রেশ হচ্ছে..." : "রিফ্রেশ করুন"}
        </Button>
      </div>

      {error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">{error}</p>
            <p className="text-red-500 text-center text-sm mt-2">BondhuMart Database কানেকশন ঠিক আছে কিনা চেক করুন (.env ফাইল)।</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading && products.length === 0 ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed rounded-lg">
              <Box className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
            </div>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* ইমেজ প্লেসহোল্ডার (পরে আসল ইমেজ URL বসানো যাবে) */}
                <div className="h-40 bg-slate-100 flex items-center justify-center border-b relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="object-cover h-full w-full" />
                  ) : (
                    <Package className="h-12 w-12 text-slate-300" />
                  )}
                  {product.status === 'active' ? (
                    <Badge className="absolute top-2 right-2 bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="destructive" className="absolute top-2 right-2">Inactive</Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-2 min-h-[56px] leading-tight mb-2">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-2 mt-4 text-sm">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-green-600"/> বিক্রয় মূল্য:</span>
                      <span className="font-bold text-lg text-slate-900">৳{product.price}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1"><Tag className="h-4 w-4"/> কেনা দাম:</span>
                      <span>৳{product.buying_price}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1"><Activity className="h-4 w-4 text-blue-500"/> প্রফিট:</span>
                      <span className="text-green-600 font-medium">৳{product.profit_margin}</span>
                    </div>
                  </div>
                </CardContent>
                
                <div className="bg-slate-50 p-3 border-t text-xs flex justify-between items-center text-slate-500">
                  <span>স্টক: <strong className={product.stock <= (product.low_stock_threshold || 5) ? "text-red-500" : "text-green-600"}>{product.stock} পিস</strong></span>
                  <span>ID: {product.id}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
