import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getFamilyUserIds } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface CategoryStat {
  name: string;
  icon: string;
  type: string;
  total: number;
  count: number;
  avgPerTransaction: number;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all family member IDs for shared data
    const familyUserIds = await getFamilyUserIds(session.user.id);

    // Get transactions from the last 3 months for analysis
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: { in: familyUserIds },
        date: { gte: threeMonthsAgo },
      },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    if (transactions.length < 5) {
      return NextResponse.json({
        prediction: null,
        message: "Cần ít nhất 5 giao dịch để dự đoán. Hãy thêm thêm giao dịch!",
      });
    }

    // Analyze spending patterns by category
    const categoryStats = new Map<string, CategoryStat>();
    const monthlyTrends: MonthlyTrend[] = [];

    transactions.forEach((t) => {
      const key = t.category.name;
      const existing = categoryStats.get(key);

      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
        existing.avgPerTransaction = existing.total / existing.count;
      } else {
        categoryStats.set(key, {
          name: t.category.name,
          icon: t.category.icon,
          type: t.type,
          total: t.amount,
          count: 1,
          avgPerTransaction: t.amount,
        });
      }
    });

    // Calculate monthly totals
    const monthlyData = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyData.get(monthKey) || { income: 0, expense: 0 };

      if (t.type === "income") {
        existing.income += t.amount;
      } else {
        existing.expense += t.amount;
      }
      monthlyData.set(monthKey, existing);
    });

    monthlyData.forEach((data, month) => {
      monthlyTrends.push({
        month,
        income: data.income,
        expense: data.expense,
      });
    });

    // Sort by month
    monthlyTrends.sort((a, b) => a.month.localeCompare(b.month));

    // Calculate averages
    const totalMonths = monthlyTrends.length || 1;
    const avgMonthlyIncome = monthlyTrends.reduce((sum, m) => sum + m.income, 0) / totalMonths;
    const avgMonthlyExpense = monthlyTrends.reduce((sum, m) => sum + m.expense, 0) / totalMonths;

    // Prepare data for AI analysis
    const categoryStatsArray = Array.from(categoryStats.values());
    const expenseCategories = categoryStatsArray.filter((c) => c.type === "expense");
    const incomeCategories = categoryStatsArray.filter((c) => c.type === "income");

    // Call AI for prediction
    const prediction = await generatePrediction({
      avgMonthlyIncome,
      avgMonthlyExpense,
      expenseCategories,
      incomeCategories,
      monthlyTrends,
      totalTransactions: transactions.length,
    });

    return NextResponse.json({
      prediction,
      stats: {
        avgMonthlyIncome,
        avgMonthlyExpense,
        monthlyTrends,
        topExpenses: expenseCategories
          .sort((a, b) => b.total - a.total)
          .slice(0, 5),
        totalTransactions: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error generating prediction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generatePrediction(data: {
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  expenseCategories: CategoryStat[];
  incomeCategories: CategoryStat[];
  monthlyTrends: MonthlyTrend[];
  totalTransactions: number;
}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const formatMoney = (amount: number) =>
      new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + "đ";

    const expenseSummary = data.expenseCategories
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((c) => `- ${c.icon} ${c.name}: ${formatMoney(c.total)} (${c.count} lần)`)
      .join("\n");

    const incomeSummary = data.incomeCategories
      .map((c) => `- ${c.icon} ${c.name}: ${formatMoney(c.total)} (${c.count} lần)`)
      .join("\n");

    const trendSummary = data.monthlyTrends
      .map((m) => `- ${m.month}: Thu ${formatMoney(m.income)}, Chi ${formatMoney(m.expense)}`)
      .join("\n");

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

    const prompt = `Bạn là chuyên gia tài chính cá nhân. Phân tích dữ liệu chi tiêu và đưa ra dự đoán cho tháng tới.

📊 DỮ LIỆU 3 THÁNG GẦN NHẤT:

Thu nhập trung bình/tháng: ${formatMoney(data.avgMonthlyIncome)}
Chi tiêu trung bình/tháng: ${formatMoney(data.avgMonthlyExpense)}
Số dư trung bình/tháng: ${formatMoney(data.avgMonthlyIncome - data.avgMonthlyExpense)}

📈 XU HƯỚNG THEO THÁNG:
${trendSummary}

💸 CHI TIÊU THEO DANH MỤC:
${expenseSummary}

💰 THU NHẬP THEO DANH MỤC:
${incomeSummary}

Tổng số giao dịch: ${data.totalTransactions}

Hãy phân tích và trả về JSON với format sau (CHỈ trả về JSON, không có text khác):
{
  "predictedIncome": <số tiền dự đoán thu nhập tháng tới>,
  "predictedExpense": <số tiền dự đoán chi tiêu tháng tới>,
  "predictedBalance": <số tiền dự đoán số dư tháng tới>,
  "confidence": <độ tin cậy từ 1-100>,
  "trend": "<up/down/stable - xu hướng chi tiêu>",
  "summary": "<tóm tắt ngắn gọn 1-2 câu về tình hình tài chính>",
  "tips": [
    "<lời khuyên 1>",
    "<lời khuyên 2>",
    "<lời khuyên 3>"
  ],
  "warnings": [
    "<cảnh báo nếu có, để trống nếu không>"
  ],
  "topSpendingCategory": "<danh mục chi nhiều nhất>",
  "savingPotential": <số tiền có thể tiết kiệm thêm>
}

Lưu ý:
- Dự đoán dựa trên xu hướng 3 tháng gần nhất
- Xem xét các biến động theo mùa (tháng ${nextMonthName})
- Đưa ra lời khuyên thực tế, cụ thể
- Nếu chi tiêu > thu nhập, cảnh báo rõ ràng`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      predictedIncome: Number(parsed.predictedIncome) || data.avgMonthlyIncome,
      predictedExpense: Number(parsed.predictedExpense) || data.avgMonthlyExpense,
      predictedBalance: Number(parsed.predictedBalance) || (data.avgMonthlyIncome - data.avgMonthlyExpense),
      confidence: Number(parsed.confidence) || 70,
      trend: parsed.trend || "stable",
      summary: parsed.summary || "Dựa trên dữ liệu hiện có, tài chính của bạn đang ổn định.",
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter(Boolean) : [],
      topSpendingCategory: parsed.topSpendingCategory || "",
      savingPotential: Number(parsed.savingPotential) || 0,
      monthName: nextMonthName,
    };
  } catch (error) {
    console.error("AI prediction error:", error);
    
    // Fallback prediction based on averages
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return {
      predictedIncome: data.avgMonthlyIncome,
      predictedExpense: data.avgMonthlyExpense,
      predictedBalance: data.avgMonthlyIncome - data.avgMonthlyExpense,
      confidence: 50,
      trend: "stable",
      summary: "Dự đoán dựa trên mức trung bình 3 tháng gần nhất.",
      tips: [
        "Theo dõi chi tiêu hàng ngày",
        "Đặt mục tiêu tiết kiệm cụ thể",
        "Hạn chế chi tiêu không cần thiết",
      ],
      warnings: [],
      topSpendingCategory: data.expenseCategories[0]?.name || "",
      savingPotential: 0,
      monthName: nextMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }),
    };
  }
}
