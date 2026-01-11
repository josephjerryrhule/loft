const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRuntimeValidation() {
  try {
    const userId = '569e3fe5-70cf-4bf9-8173-8f095e8530ee';
    
    console.log('🔍 Testing Runtime Validation...');
    console.log('');
    
    // This is the same query used in the application
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        customerId: userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      include: { plan: true }
    });
    
    console.log('Query conditions:');
    console.log('   - customerId:', userId);
    console.log('   - status: "ACTIVE"');
    console.log('   - endDate >= NOW()');
    console.log('');
    
    if (activeSubscription) {
      console.log('❌ FAILED: User still has active subscription access');
      console.log('   This should not happen!');
      console.log('   Found:', activeSubscription);
    } else {
      console.log('✅ SUCCESS: User does NOT have active subscription');
      console.log('   User will be blocked from premium content');
      console.log('   Only free flipbooks will be accessible');
    }
    
    console.log('');
    console.log('📚 Flipbook Access Check:');
    
    // Check what flipbooks would be accessible
    const flipbooks = await prisma.flipbook.findMany({
      where: {
        isPublished: true,
        ...(activeSubscription ? {} : { isFree: true })
      },
      select: {
        id: true,
        title: true,
        isFree: true
      },
      take: 5
    });
    
    console.log(`   User can access ${flipbooks.length} flipbooks:`);
    flipbooks.forEach(fb => {
      console.log(`   - ${fb.title} ${fb.isFree ? '(FREE)' : '(PREMIUM)'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRuntimeValidation();
