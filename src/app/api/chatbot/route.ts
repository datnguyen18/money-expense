import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ParsedTransaction {
  amount: number;
  description: string;
  categoryName: string;
  type: "expense" | "income";
  date: string;
}

async function parseWithAI(
  message: string,
  categories: Array<{ name: string; type: string }>
): Promise<ParsedTransaction | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const categoryList = categories
      .map((c) => `- ${c.name} (${c.type === "expense" ? "chi tiêu" : "thu nhập"})`)
      .join("\n");

    const today = new Date().toISOString().split("T")[0];

    const prompt = `Bạn là trợ lý phân tích giao dịch tài chính. Phân tích tin nhắn tiếng Việt và trích xuất thông tin giao dịch.

Danh sách danh mục có sẵn:
${categoryList}

Ngày hôm nay: ${today}

Tin nhắn người dùng: "${message}"

Hãy phân tích và trả về JSON với format sau (CHỈ trả về JSON, không có text khác):
{
  "amount": <số tiền bằng số, đơn vị VND - ví dụ 50k = 50000, 1tr = 1000000>,
  "description": "<mô tả ngắn gọn>",
  "categoryName": "<tên danh mục phù hợp nhất từ danh sách trên>",
  "type": "<expense hoặc income>",
  "date": "<ngày theo format YYYY-MM-DD, nếu 'hôm qua' thì trừ 1 ngày, 'hôm kia' trừ 2 ngày>"
}

Nếu không thể phân tích được, trả về: {"error": "không hiểu"}

Quy tắc:
- "k" hoặc "K" = nghìn (x1000)
- "tr", "triệu", "m" = triệu (x1000000)  
- Mặc định là chi tiêu (expense) trừ khi có từ như: nhận, lương, thưởng, thu, được tiền, bán
- Chọn danh mục phù hợp nhất với nội dung`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error) return null;

    return {
      amount: Number(parsed.amount),
      description: parsed.description,
      categoryName: parsed.categoryName,
      type: parsed.type as "expense" | "income",
      date: parsed.date,
    };
  } catch (error) {
    console.error("AI parsing error:", error);
    return null;
  }
}

// Fallback: Simple rule-based parser (when AI is not available)
function parseWithRules(
  message: string
): ParsedTransaction | null {
  const lowerMessage = message.toLowerCase();

  // Parse amount
  let amount = 0;
  const amountPatterns = [
    /(\d+(?:[.,]\d{3})*)\s*(?:đ|đồng|vnd|d)/i,
    /(\d+(?:\.\d+)?)\s*(?:tr|triệu|m)/i,
    /(\d+(?:\.\d+)?)\s*(?:k|K|nghìn|ngàn)/i,
    /(\d+(?:[.,]\d{3})*)/,
  ];

  for (const pattern of amountPatterns) {
    const match = message.match(pattern);
    if (match) {
      const num = match[1].replace(/[.,]/g, "");
      amount = parseFloat(num);
      if (/tr|triệu|m/i.test(match[0])) {
        amount *= 1000000;
      } else if (/k|K|nghìn|ngàn/i.test(match[0])) {
        amount *= 1000;
      }
      break;
    }
  }

  if (amount <= 0) return null;

  // Determine type
  const incomeKeywords = ["nhận", "thu", "lương", "thưởng", "được", "bán", "tiền về"];
  let type: "expense" | "income" = "expense";
  for (const keyword of incomeKeywords) {
    if (lowerMessage.includes(keyword)) {
      type = "income";
      break;
    }
  }

  // Match category
  const categoryKeywords: Record<string, string[]> = {
    "Ăn uống": ["ăn", "uống", "cơm", "phở", "cafe", "trưa", "sáng", "tối", "nhậu", "bia"],
    "Di chuyển": ["grab", "xe", "taxi", "xăng", "gửi xe"],
    "Mua sắm": ["mua", "shopping", "shopee", "lazada"],
    "Giải trí": ["xem phim", "game", "chơi", "du lịch", "karaoke"],
    "Hóa đơn": ["điện", "nước", "internet", "wifi", "tiền nhà"],
    "Sức khỏe": ["thuốc", "bệnh viện", "khám"],
    "Lương": ["lương", "salary"],
    "Thưởng": ["thưởng", "bonus"],
  };

  let matchedCategory = type === "income" ? "Thu nhập khác" : "Khác";
  let maxMatches = 0;

  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter((k) => lowerMessage.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = categoryName;
    }
  }

  // Parse date
  const date = new Date();
  if (lowerMessage.includes("hôm qua")) {
    date.setDate(date.getDate() - 1);
  } else if (lowerMessage.includes("hôm kia")) {
    date.setDate(date.getDate() - 2);
  }

  // Clean up description - remove amount, common filler words
  let description = message
    .replace(/\d+(?:[.,]\d{3})*\s*(?:k|K|tr|triệu|nghìn|ngàn|đ|đồng|vnd|d)?/gi, "") // Remove amounts
    .replace(/^(mình|tôi|em|anh|chị|t|mk|m)\s+/gi, "") // Remove leading pronouns
    .replace(/\s+(mình|tôi|em|anh|chị)\s+/gi, " ") // Remove pronouns in middle
    .replace(/\s+(hôm nay|hôm qua|hôm kia|sáng nay|tối nay|trưa nay)/gi, "") // Remove time words
    .replace(/\s+(vừa|mới|đã|rồi|xong|được|bị|cho|về|ra|vào)/gi, " ") // Remove filler verbs
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();

  // If description is empty or too short, use category name
  if (!description || description.length < 2) {
    description = matchedCategory;
  }

  return {
    amount,
    description,
    categoryName: matchedCategory,
    type,
    date: date.toISOString().split("T")[0],
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user's categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isDefault: true, userId: null }, { userId: session.user.id }],
      },
    });

    // Try AI parsing first, fallback to rules
    let parsed: ParsedTransaction | null = null;
    let usedAI = false;

    if (process.env.GEMINI_API_KEY) {
      parsed = await parseWithAI(message, categories);
      usedAI = !!parsed;
    }

    if (!parsed) {
      parsed = parseWithRules(message);
    }

    if (!parsed) {
      return NextResponse.json({
        success: false,
        reply: "Xin lỗi, mình không hiểu. Bạn có thể nhập theo dạng:\n• 'ăn trưa 50k'\n• 'đổ xăng 200 nghìn'\n• 'nhận lương 15 triệu'",
      });
    }

    // Find the category
    let category = categories.find(
      (c) => c.name.toLowerCase() === parsed!.categoryName.toLowerCase()
    );

    // Fallback to default category of same type
    if (!category) {
      category = categories.find((c) => c.type === parsed!.type);
    }

    if (!category) {
      return NextResponse.json({
        success: false,
        reply: `Không tìm thấy danh mục phù hợp. Vui lòng tạo danh mục trước.`,
      });
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: parsed.amount,
        description: parsed.description,
        date: new Date(parsed.date),
        type: parsed.type,
        categoryId: category.id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    });

    const formattedAmount = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parsed.amount);

    const formattedDate = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(parsed.date));

    return NextResponse.json({
      success: true,
      transaction,
      usedAI,
      reply: `✅ Đã ghi nhận ${parsed.type === "income" ? "thu nhập" : "chi tiêu"}:

💰 Số tiền: ${formattedAmount}
📁 Danh mục: ${category.icon} ${category.name}
📝 Mô tả: ${parsed.description}
📅 Ngày: ${formattedDate}
${usedAI ? "\n🤖 Phân tích bởi AI" : ""}`,
    });
  } catch (error) {
    console.error("Error in chatbot:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
