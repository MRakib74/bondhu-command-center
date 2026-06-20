import prisma from "./prisma"

export async function sendOrderNotification(order: any, messageText: string, invoicePdfUrl?: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME
  const apikey = process.env.EVOLUTION_API_KEY
  
  const phone = order.phone.replace(/[^0-9]/g, '')
  // Auto-format for BD
  const formattedPhone = phone.startsWith('880') ? phone : (phone.startsWith('0') ? '88' + phone : '880' + phone)

  let sentViaWhatsApp = false

  if (evolutionUrl && instanceName && apikey) {
    try {
      // 1. Check if number exists on WhatsApp
      const checkRes = await fetch(`${evolutionUrl}/chat/whatsappNumbers/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apikey
        },
        body: JSON.stringify({ numbers: [formattedPhone] })
      })

      if (checkRes.ok) {
        const checkData = await checkRes.json()
        const exists = checkData[0]?.exists || false

        if (exists) {
          const remoteJid = checkData[0].jid

          // Send Invoice Document if exists
          if (invoicePdfUrl) {
            await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": apikey
              },
              body: JSON.stringify({
                number: remoteJid,
                options: { delay: 1200, presence: "composing" },
                mediaMessage: {
                  mediatype: "document",
                  caption: messageText,
                  media: invoicePdfUrl,
                  fileName: `Invoice_Order_${order.bondhumartId}.pdf`
                }
              })
            })
          } else {
            // Send Text
            await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": apikey
              },
              body: JSON.stringify({
                number: remoteJid,
                options: { delay: 1200, presence: "composing" },
                textMessage: { text: messageText }
              })
            })
          }

          sentViaWhatsApp = true
        }
      }
    } catch (error) {
      console.error("Evolution API Check/Send Error:", error)
    }
  }

  // 2. Fallback to SMS if WhatsApp failed or not available
  if (!sentViaWhatsApp) {
    console.log(`WhatsApp not available for ${formattedPhone}. Falling back to SMS...`)
    await sendFallbackSMS(formattedPhone, messageText)
  }
}

async function sendFallbackSMS(phone: string, text: string) {
  const smsApiUrl = process.env.SMS_API_URL
  const smsApiKey = process.env.SMS_API_KEY
  const smsSenderId = process.env.SMS_SENDER_ID

  if (!smsApiUrl || !smsApiKey) {
    console.log("SMS Gateway not configured.")
    return
  }

  try {
    // Example using standard SMS Gateway format (can be adapted to BulkSMSBD, SMSQ etc.)
    await fetch(smsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: smsApiKey,
        senderid: smsSenderId,
        number: phone,
        message: text
      })
    })
    console.log(`SMS Fallback Sent to ${phone}`)
  } catch (err) {
    console.error("Failed to send fallback SMS:", err)
  }
}
