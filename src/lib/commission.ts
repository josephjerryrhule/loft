import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";

const SIGNUP_BONUS = 5.00;
const MANAGER_PERCENTAGE = 0.20; // 20%
const AFFILIATE_SUBSCRIPTION_FLAT = 10.00;

export async function processOrderCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, customer: true, referredBy: true }
  });

  if (!order || !order.referredBy) return;

  const referrer = order.referredBy;
  const product = order.product;
  const totalAmount = parseFloat(order.totalAmount.toString());

  // 1. Affiliate Commission (Flat rate per product)
  if (referrer.role === Role.AFFILIATE) {
      await prisma.commission.create({
          data: {
              userId: referrer.id,
              sourceType: "PRODUCT",
              sourceId: order.id,
              amount: product.affiliateCommissionAmount,
              status: "PENDING"
          }
      });

      // 2. Manager Commission (20% of Product Price)
      if (referrer.managerId) {
          await prisma.commission.create({
              data: {
                  userId: referrer.managerId,
                  sourceType: "PRODUCT",
                  sourceId: order.id,
                  amount: totalAmount * MANAGER_PERCENTAGE,
                  status: "PENDING"
              }
          });
      }
  } else if (referrer.role === Role.MANAGER) {
      // Direct Manager Sale? (Spec says Manager earns 20% + potentially signup bonus if new)
      // For simplicity, we just give them the 20% commission on direct sale too per spec logic logic overlap
      await prisma.commission.create({
          data: {
              userId: referrer.id,
              sourceType: "PRODUCT",
              sourceId: order.id,
              amount: totalAmount * MANAGER_PERCENTAGE,
              status: "PENDING"
          }
      });
  }
}

export async function processSignupCommission(newUserId: string, referrerCode: string) {
    const referrer = await prisma.user.findUnique({ where: { inviteCode: referrerCode }});
    if (!referrer) return;

    // Spec: Affiliate earns GHS 5.00 per signup
    // Manager earns GHS 5.00 only when direct signup
    
    // We only pay if it's a Customer signup
    const newUser = await prisma.user.findUnique({ where: { id: newUserId }});
    if (newUser?.role !== Role.CUSTOMER) return;

    await prisma.commission.create({
        data: {
            userId: referrer.id,
            sourceType: "SIGNUP",
            sourceId: newUserId,
            amount: SIGNUP_BONUS,
            status: "PENDING"
        }
    });
}
