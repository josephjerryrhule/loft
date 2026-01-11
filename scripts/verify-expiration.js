const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyExpiration() {
  try {
    const subscriptionId = 'b0fa65e6-56a0-42d4-9f19-b466555848d5';
    
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: {
          select: { email: true, firstName: true, lastName: true }
        },
        plan: {
          select: { name: true }
        }
      }
    });

    console.log('📊 Subscription Details:');
    console.log('   ID:', subscription.id);
    console.log('   Customer:', subscription.customer.email);
    console.log('   Plan:', subscription.plan.name);
    console.log('   Status:', subscription.status);
    console.log('   Start Date:', subscription.startDate.toLocaleDateString());
    console.log('   End Date:', subscription.endDate.toLocaleDateString());
    console.log('');
    
    if (subscription.status === 'EXPIRED') {
      console.log('✅ SUCCESS: Subscription was expired correctly!');
    } else {
      console.log('❌ FAILED: Subscription status is still:', subscription.status);
    }
    
    console.log('');
    console.log('📋 Activity Log:');
    const activities = await prisma.activityLog.findMany({
      where: {
        userId: subscription.customerId,
        actionType: 'SUBSCRIPTION_EXPIRED'
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (activities.length > 0) {
      console.log('   ✅ Activity logged at:', activities[0].createdAt.toLocaleString());
      console.log('   Details:', activities[0].actionDetails);
    } else {
      console.log('   ❌ No activity log found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyExpiration();
