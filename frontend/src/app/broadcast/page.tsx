"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BroadcastPage() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [numbersInput, setNumbersInput] = useState("");
  const [checkResult, setCheckResult] = useState<{has_whatsapp: string[], no_whatsapp: string[]} | null>(null);
  const [broadcastData, setBroadcastData] = useState({
    target_segment: "hot_buyers",
    platform: "whatsapp",
    message_content: ""
  });

  const checkNumbers = async () => {
    if (!numbersInput.trim()) {
      alert("দয়া করে অন্তত একটি নাম্বার দিন!");
      return;
    }

    const numberList = numbersInput.split("\n").map(n => n.trim()).filter(n => n);
    
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/broadcast/check-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(numberList)
      });
      const data = await res.json();
      if (data.data) {
        setCheckResult(data.data);
      }
    } catch (error) {
      alert("সার্ভার এরর! আপনার Evolution API চালু আছে কিনা নিশ্চিত করুন।");
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastData.message_content) {
      alert("মেসেজ খালি রাখা যাবে না!");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastData)
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(data.message);
        setBroadcastData({...broadcastData, message_content: ""});
      } else {
        alert(data.detail || "ব্রডকাস্টে সমস্যা হয়েছে। API Key চেক করুন।");
      }
    } catch (error) {
      alert("সার্ভার এরর! Backend রান করা আছে কিনা চেক করুন।");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Send className="text-blue-500" /> মাল্টি-চ্যানেল ব্রডকাস্ট
        </h1>
        <p className="text-muted-foreground mt-2">
          Evolution API ব্যবহার করে ফ্রিতে হোয়াটসঅ্যাপ ব্রডকাস্ট করুন এবং নাম্বার চেক করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Number Checker */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>হোয়াটসঅ্যাপ নাম্বার চেকার</CardTitle>
            <CardDescription>লিডগুলো দিন, আমরা চেক করে দিবো কার হোয়াটসঅ্যাপ আছে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>নাম্বারগুলো পেস্ট করুন (প্রতি লাইনে একটি)</Label>
              <Textarea 
                placeholder="01712345678&#10;8801812345678" 
                className="h-[150px] resize-none"
                value={numbersInput}
                onChange={(e) => setNumbersInput(e.target.value)}
              />
            </div>
            <Button 
              onClick={checkNumbers} 
              disabled={loading} 
              className="w-full bg-slate-900 text-white"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "চেক হচ্ছে..." : "Evolution API দিয়ে চেক করুন"}
            </Button>

            {checkResult && (
              <div className="mt-6 space-y-4 border-t pt-4">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle className="h-5 w-5" /> 
                  হোয়াটসঅ্যাপ আছে: {checkResult.has_whatsapp.length} টি
                </div>
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <AlertTriangle className="h-5 w-5" /> 
                  হোয়াটসঅ্যাপ নেই: {checkResult.no_whatsapp.length} টি (এদেরকে SMS পাঠাবেন)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Broadcast Sender */}
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-900">অফার ব্রডকাস্ট করুন</CardTitle>
            <CardDescription>ফিল্টার করা কাস্টমারদের সরাসরি মেসেজ পাঠান</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>কাকে পাঠাবেন?</Label>
              <Select value={broadcastData.target_segment} onValueChange={(val: string | null) => setBroadcastData({...broadcastData, target_segment: val || ""})}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="টার্গেট সিলেক্ট করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot_buyers">🔥 Hot Buyers (লাস্ট ৭ দিন)</SelectItem>
                  <SelectItem value="inactive">😴 Inactive (৩০ দিনের বেশি)</SelectItem>
                  <SelectItem value="has_whatsapp">✅ একটু আগে চেক করা WhatsApp লিস্ট</SelectItem>
                  <SelectItem value="custom">✍️ ম্যানুয়াল লিস্ট</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>কোন মাধ্যমে পাঠাবেন?</Label>
              <Select value={broadcastData.platform} onValueChange={(val: string | null) => setBroadcastData({...broadcastData, platform: val || ""})}>
                <SelectTrigger className="bg-blue-50 border-blue-200 text-blue-900">
                  <SelectValue placeholder="মাধ্যম সিলেক্ট করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">💬 WhatsApp (Evolution API)</SelectItem>
                  <SelectItem value="sms">📱 SMS (Bulk SMS BD)</SelectItem>
                  <SelectItem value="email">📧 Email (SMTP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>মেসেজ / অফার</Label>
              <Textarea 
                placeholder="ভাইয়া, আমাদের নতুন প্রোডাক্ট চলে এসেছে..." 
                className="h-[150px] bg-white resize-none"
                value={broadcastData.message_content}
                onChange={(e) => setBroadcastData({...broadcastData, message_content: e.target.value})}
              />
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={sendBroadcast}
              disabled={sending}
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sending ? "ব্রডকাস্ট হচ্ছে..." : `ব্রডকাস্ট শুরু করুন (${broadcastData.platform.toUpperCase()})`}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {broadcastData.platform === 'whatsapp' ? 'Evolution API এর মাধ্যমে মেসেজ পাঠানো হবে।' : 'SMS/Email API এর মাধ্যমে পাঠানো হবে।'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
