const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestExpiredSubscription() {
  try {
    // Find a customer user
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' }
    });

    if (!customer) {
      console.log('No customer found. Creating a test customer...');
      const newCustomer = await prisma.user.create({
        data: {
          email: 'test-expired@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          passwordHash: 'dummy-hash-for-testing'
        }
      });
      console.log('✅ Created test customer:', newCustomer.email);
    }

    const userId = customer?.id || (await prisma.user.findFirst({ where: { role: 'CUSTOMER' } })).id;

    // Find a plan
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true }
    });

    if (!plan) {
      console.log('❌ No active subscription plan found. Please create a plan first.');
      process.exit(1);
    }

    // Create an expired subscription
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const subscription = await prisma.subscription.create({
      data: {
        customerId: userId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: twoWeeksAgo,
        endDate: yesterday, // Expired yesterday
        autoRenew: false
      }
    });

    console.log('✅ Created test expired subscription:');
    console.log('   ID:', subscription.id);
    console.log('   Customer:', userId);
    console.log('   Plan:', plan.name);
    console.log('   Status:', subscription.status);
    console.log('   Start Date:', subscription.startDate.toLocaleDateString());
    console.log('   End Date:', subscription.endDate.toLocaleDateString());
    console.log('');
    console.log('🎯 Now run the cron endpoint to expire it:');
    console.log('   curl -X POST http://localhost:3000/api/cron/expire-subscriptions \\');
    console.log('     -H "Authorization: Bearer YOUR_CRON_SECRET"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestExpiredSubscription();
