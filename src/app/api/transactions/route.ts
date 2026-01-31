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
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: { in: familyUserIds }, // Query all family members' transactions
        ...dateFilter,
      },
      include: {
        category: true,
        user: {
          select: { name: true, image: true }, // Include who created the transaction
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, description, date, type, categoryId } = body;

    if (!amount || !categoryId) {
      return NextResponse.json(
        { error: "Amount and categoryId are required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
        type: type || "expense",
        categoryId,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
