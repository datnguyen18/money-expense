import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getFamilyUserIds } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all family member IDs for shared data
    const familyUserIds = await getFamilyUserIds(session.user.id);

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();
    const month = searchParams.get("month");

    let dateFilter: { gte: Date; lte: Date };
    
    if (month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = { gte: startDate, lte: endDate };
    } else {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      dateFilter = { gte: startDate, lte: endDate };
    }

    // Get all transactions for the period (including family members)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: { in: familyUserIds }, // Include all family members
        date: dateFilter,
      },
      include: {
        category: true,
      },
    });

    // Calculate category stats
    const categoryStatsMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      categoryIcon: string;
      categoryColor: string;
      type: string;
      total: number;
      count: number;
    }>();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const key = t.categoryId;
      const existing = categoryStatsMap.get(key);
      
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
      } else {
        categoryStatsMap.set(key, {
          categoryId: t.categoryId,
          categoryName: t.category.name,
          categoryIcon: t.category.icon,
          categoryColor: t.category.color,
          type: t.type,
          total: t.amount,
          count: 1,
        });
      }

      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    // Calculate percentages
    const categoryStats = Array.from(categoryStatsMap.values()).map((stat) => ({
      ...stat,
      percentage: stat.type === "income" 
        ? (totalIncome > 0 ? (stat.total / totalIncome) * 100 : 0)
        : (totalExpense > 0 ? (stat.total / totalExpense) * 100 : 0),
    }));

    // Calculate monthly stats for the year
    const monthlyStats = [];
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(parseInt(year), m - 1, 1);
      const monthEnd = new Date(parseInt(year), m, 0, 23, 59, 59);
      
      const monthTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyStats.push({
        month: `T${m}`,
        income,
        expense,
        balance: income - expense,
      });
    }

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryStats: categoryStats.sort((a, b) => b.total - a.total),
      monthlyStats,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
