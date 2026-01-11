const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function expireAllUserSubscriptions() {
  try {
    const userId = '569e3fe5-70cf-4bf9-8173-8f095e8530ee';
    
    // Update all active subscriptions to have an endDate in the past
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const result = await prisma.subscription.updateMany({
      where: {
        customerId: userId,
        status: 'ACTIVE'
      },
      data: {
        endDate: yesterday
      }
    });
    
    console.log(`✅ Updated ${result.count} subscription(s) to expire yesterday`);
    console.log('');
    console.log('🎯 Now run the cron to expire them and assign free plan:');
    console.log('   curl -X POST http://localhost:3000/api/cron/expire-subscriptions \\');
    console.log('     -H "Authorization: Bearer YOUR_CRON_SECRET"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

expireAllUserSubscriptions();
