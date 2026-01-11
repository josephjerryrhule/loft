const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFreePlanAssignment() {
  try {
    const userId = '569e3fe5-70cf-4bf9-8173-8f095e8530ee';
    
    console.log('🔍 Checking user subscriptions...\n');
    
    // Get all subscriptions for this user
    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: userId },
      include: {
        plan: {
          select: { name: true, price: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${subscriptions.length} subscriptions:\n`);
    
    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.plan.name} (GHS ${sub.plan.price})`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Start: ${sub.startDate.toLocaleDateString()}`);
      console.log(`   End: ${sub.endDate.toLocaleDateString()}`);
      console.log(`   Created: ${sub.createdAt.toLocaleString()}`);
      console.log('');
    });
    
    // Check active subscriptions
    const activeSubscriptions = subscriptions.filter(
      s => s.status === 'ACTIVE' && s.endDate >= new Date()
    );
    
    console.log('📊 Summary:');
    console.log(`   Total: ${subscriptions.length}`);
    console.log(`   Active: ${activeSubscriptions.length}`);
    console.log(`   Expired: ${subscriptions.filter(s => s.status === 'EXPIRED').length}`);
    console.log('');
    
    if (activeSubscriptions.length > 0) {
      console.log('✅ User has active subscription(s):');
      activeSubscriptions.forEach(sub => {
        console.log(`   - ${sub.plan.name} (GHS ${sub.plan.price})`);
      });
      
      const hasFreePlan = activeSubscriptions.some(s => Number(s.plan.price) === 0);
      if (hasFreePlan) {
        console.log('\n✅ SUCCESS: User is on the FREE PLAN');
        console.log('   User can only access free flipbooks');
      } else {
        console.log('\n📌 User has paid subscription(s)');
        console.log('   User can access all flipbooks');
      }
    } else {
      console.log('❌ User has no active subscriptions');
      console.log('   This should not happen after expiration!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFreePlanAssignment();
