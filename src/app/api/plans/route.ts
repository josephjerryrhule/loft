import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    // Format the decimal prices as numbers for easy consumption
    const formattedPlans = plans.map(plan => ({
      ...plan,
      price: Number(plan.price),
      priceUSD: plan.priceUSD ? Number(plan.priceUSD) : null,
      affiliateCommissionPercentage: plan.affiliateCommissionPercentage 
        ? Number(plan.affiliateCommissionPercentage) 
        : null,
    }));

    return new NextResponse(JSON.stringify(formattedPlans), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch subscription plans" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
