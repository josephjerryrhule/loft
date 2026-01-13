import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // @ts-ignore - role exists in our custom session type
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        inviteCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only generate QR codes for managers and affiliates
    if (user.role !== "MANAGER" && user.role !== "AFFILIATE") {
      return NextResponse.json(
        { error: "QR codes only available for managers and affiliates" },
        { status: 400 }
      );
    }

    if (!user.inviteCode) {
      return NextResponse.json(
        { error: "User has no invite code" },
        { status: 400 }
      );
    }

    // Construct the invite URL
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    let inviteUrl: string;
    
    if (user.role === "MANAGER") {
      // Manager QR code links to affiliate signup
      inviteUrl = `${baseUrl}/join/affiliate?code=${user.inviteCode}`;
    } else if (user.role === "AFFILIATE") {
      // Affiliate QR code links to customer signup
      inviteUrl = `${baseUrl}/join/customer?code=${user.inviteCode}`;
    } else {
      return NextResponse.json(
        { error: "Invalid user role for QR code" },
        { status: 400 }
      );
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Convert data URL to buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Set filename
    const fileName = `${user.role.toLowerCase()}-${user.firstName || "user"}-${user.lastName || ""}-qr.png`
      .toLowerCase()
      .replace(/\s+/g, "-");

    // Return the image
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
