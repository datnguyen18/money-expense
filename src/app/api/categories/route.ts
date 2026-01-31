import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all categories (default + user's custom)
    let categories = await prisma.category.findMany({
      where: {
        OR: [
          { isDefault: true, userId: null },
          { userId: session.user.id },
        ],
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    // If no default categories exist, create them
    if (categories.filter((c) => c.isDefault).length === 0) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          userId: null,
        })),
      });
      
      categories = await prisma.category.findMany({
        where: {
          OR: [
            { isDefault: true, userId: null },
            { userId: session.user.id },
          ],
        },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
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
    const { name, icon, color, type } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || "📁",
        color: color || "#6366f1",
        type: type || "expense",
        isDefault: false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
