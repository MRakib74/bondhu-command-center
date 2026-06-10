import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * Generates a reply for an incoming customer message.
 * This function enforces the "Short & Convincing Message" constraint.
 */
export async function generateCustomerReply(customerPhone: string, messageText: string) {
  // 1. Fetch relevant context
  // a) Fetch active ad products
  const activeProducts = await prisma.product.findMany({
    where: { isAdActive: true }
  })
  
  // b) Fetch company policies from Knowledge Base
  const policies = await prisma.knowledgeBase.findMany()
  const policyText = policies.map(p => `${p.topic}: ${p.content}`).join("\n")
  
  // c) Fetch customer history (if exists)
  const customer = await prisma.customer.findUnique({
    where: { phone: customerPhone },
    include: { orders: true }
  })

  // 2. Build the System Prompt
  // Enforcing the constraint: Short and Convincing (Banglish/Bengali).
  const systemPrompt = `
You are the primary sales and support agent for Bondhumart.
Your goal is to be extremely helpful, converting leads into sales.

### CRITICAL CONSTRAINTS:
1. Keep the message SHORT, concise, and sweet. Maximum 2-3 sentences.
2. Be highly CONVINCING and polite.
3. If the user writes in Banglish (e.g. "kemon acho"), reply in Banglish. If they write in Bengali (e.g. "কেমন আছো"), reply in Bengali. If English, reply in English.
4. ONLY give information based on the Company Policies and Active Products listed below. Do NOT make up prices or policies.

### COMPANY POLICIES:
${policyText}

### ACTIVE AD PRODUCTS (Products currently on offer):
${activeProducts.map(p => `- ${p.name}: Price BDT ${p.price}. (Stock: ${p.stock}). Details: ${p.description}`).join("\n")}

### CUSTOMER INFO:
Name: ${customer?.name || "Unknown"}
Total Previous Orders: ${customer?.totalOrders || 0}
  `

  // 3. Generate response using Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  
  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Customer Message: ${messageText}` }
    ])
    
    const aiResponse = result.response.text()

    // 4. Save to Chat Logs
    await prisma.chatLog.create({
      data: {
        customerPhone,
        message: messageText,
        aiResponse: aiResponse
      }
    })

    return aiResponse

  } catch (error) {
    console.error("AI Generation Error:", error)
    return "দুঃখিত, এই মুহূর্তে আমি আপনার মেসেজটি বুঝতে পারছি না। দয়া করে একটু পর আবার চেষ্টা করুন।"
  }
}
