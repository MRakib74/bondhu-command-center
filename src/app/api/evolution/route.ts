import { NextResponse } from "next/server"
import { generateCustomerReply } from "@/lib/ai"

/**
 * Webhook Endpoint to receive WhatsApp messages from Evolution API
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Evolution API sends messages in a specific payload format
    // Example: body.event === 'messages.upsert'
    
    if (body.event === 'messages.upsert' && body.data) {
      const messageData = body.data.messages[0]
      
      // Ignore status updates or own messages
      if (messageData.key.fromMe) {
        return NextResponse.json({ success: true })
      }

      const remoteJid = messageData.key.remoteJid // e.g. "8801819XXXXXX@s.whatsapp.net"
      const phone = remoteJid.split('@')[0]
      
      // Extract text or image/audio caption
      let text = ""
      const msgType = Object.keys(messageData.message || {})[0]
      
      if (msgType === 'conversation') {
        text = messageData.message.conversation
      } else if (msgType === 'extendedTextMessage') {
        text = messageData.message.extendedTextMessage.text
      } else if (msgType === 'imageMessage') {
        // Here we would normally download the image and pass to Gemini Vision
        text = messageData.message.imageMessage.caption || "[Image Received]"
      } else if (msgType === 'audioMessage') {
        // Here we would run Speech-to-Text
        text = "[Voice Note Received]"
      }

      if (text) {
        // Process through AI
        const aiReply = await generateCustomerReply(phone, text)
        
        // Send reply back via Evolution API
        await sendEvolutionMessage(remoteJid, aiReply)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Evolution Webhook Error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}

async function sendEvolutionMessage(remoteJid: string, text: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME
  const apikey = process.env.EVOLUTION_API_KEY
  
  if (!evolutionUrl || !instanceName || !apikey) return

  try {
    await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apikey
      },
      body: JSON.stringify({
        number: remoteJid,
        options: {
          delay: 1200,
          presence: "composing"
        },
        textMessage: {
          text: text
        }
      })
    })
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error)
  }
}
