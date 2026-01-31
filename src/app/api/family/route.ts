import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// GET: Get current user's family info
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true },
    });

    if (!user?.familyId) {
      return NextResponse.json({ familyId: null, members: [] });
    }

    // Get all family members
    const members = await prisma.user.findMany({
      where: { familyId: user.familyId },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ familyId: user.familyId, members });
  } catch (error) {
    console.error("Error fetching family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create or join a family
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, familyId, email } = body;

    if (action === "create") {
      // Create a new family
      const newFamilyId = uuidv4();
      await prisma.user.update({
        where: { id: session.user.id },
        data: { familyId: newFamilyId },
      });
      return NextResponse.json({ familyId: newFamilyId, message: "Đã tạo gia đình mới" });
    }

    if (action === "join" && familyId) {
      // Join existing family by familyId
      await prisma.user.update({
        where: { id: session.user.id },
        data: { familyId },
      });
      return NextResponse.json({ familyId, message: "Đã tham gia gia đình" });
    }

    if (action === "invite" && email) {
      // Invite user by email (add them to current user's family)
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { familyId: true },
      });

      if (!currentUser?.familyId) {
        return NextResponse.json(
          { error: "Bạn chưa có gia đình. Hãy tạo gia đình trước." },
          { status: 400 }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "Email không tồn tại trong hệ thống" },
          { status: 404 }
        );
      }

      await prisma.user.update({
        where: { email },
        data: { familyId: currentUser.familyId },
      });

      return NextResponse.json({ message: `Đã thêm ${email} vào gia đình` });
    }

    if (action === "leave") {
      // Leave family
      await prisma.user.update({
        where: { id: session.user.id },
        data: { familyId: null },
      });
      return NextResponse.json({ message: "Đã rời khỏi gia đình" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
