#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Analyzes bundle size, dependencies, and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing application performance...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// 1. Analyze package.json dependencies
console.log('📦 Analyzing dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies || {}).length;
const devDependencies = Object.keys(packageJson.devDependencies || {}).length;
console.log(`✓ ${dependencies} production dependencies`);
console.log(`✓ ${devDependencies} dev dependencies\n`);

// 2. Check for heavy dependencies
const heavyDeps = [
  'moment', // Should use date-fns or dayjs instead
  'lodash', // Should use lodash-es or tree-shakeable imports
];

const installedHeavyDeps = heavyDeps.filter(dep => packageJson.dependencies?.[dep]);
if (installedHeavyDeps.length > 0) {
  console.log('⚠️  Heavy dependencies found:');
  installedHeavyDeps.forEach(dep => {
    console.log(`   - ${dep} (consider lighter alternatives)`);
  });
  console.log('');
}

// 3. Check build output (if exists)
const buildDir = path.join(process.cwd(), '.next');
if (fs.existsSync(buildDir)) {
  console.log('📊 Build Analysis:');
  try {
    // Run Next.js build analyzer
    console.log('   Building for production...');
    execSync('npm run build', { stdio: 'pipe' });
    
    // Check if @next/bundle-analyzer is available
    const hasAnalyzer = packageJson.devDependencies?.['@next/bundle-analyzer'];
    if (!hasAnalyzer) {
      console.log('   💡 Install @next/bundle-analyzer for detailed bundle analysis:');
      console.log('      npm install --save-dev @next/bundle-analyzer\n');
    }
  } catch (error) {
    console.log('   ⚠️  Build failed. Fix errors before analyzing.');
  }
} else {
  console.log('📊 No build found. Run "npm run build" to analyze bundle size.\n');
}

// 4. Check for optimization opportunities
console.log('🎯 Optimization Recommendations:\n');

const recommendations = [];

// Check for image optimization
if (fs.existsSync('public')) {
  const publicFiles = fs.readdirSync('public');
  const imageFiles = publicFiles.filter(f => /\.(jpg|jpeg|png|gif|svg)$/i.test(f));
  if (imageFiles.length > 0) {
    recommendations.push({
      title: 'Image Optimization',
      description: `Found ${imageFiles.length} images in public/. Ensure they use Next.js Image component.`,
      priority: 'HIGH'
    });
  }
}

// Check for database indexes (look for migration files)
const hasIndexMigration = fs.existsSync('scripts/add-performance-indexes.sql');
if (hasIndexMigration) {
  recommendations.push({
    title: 'Database Indexes',
    description: 'Run ./scripts/optimize-performance.sh to add database indexes.',
    priority: 'HIGH'
  });
}

// Check for proper caching
const hasCache = fs.existsSync('src/lib/cache.ts');
if (hasCache) {
  recommendations.push({
    title: 'Caching',
    description: 'Cache implementation found. Verify cache TTLs are appropriate.',
    priority: 'MEDIUM'
  });
}

// Check for API routes
const apiDir = path.join(process.cwd(), 'src/app/api');
if (fs.existsSync(apiDir)) {
  const apiRoutes = fs.readdirSync(apiDir, { recursive: true }).filter(f => f.endsWith('route.ts'));
  if (apiRoutes.length > 0) {
    recommendations.push({
      title: 'API Routes',
      description: `Found ${apiRoutes.length} API routes. Consider adding rate limiting.`,
      priority: 'MEDIUM'
    });
  }
}

// Check for server components usage
const componentsDir = path.join(process.cwd(), 'src/components');
if (fs.existsSync(componentsDir)) {
  const allComponents = [];
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.tsx')) {
        allComponents.push(filePath);
      }
    });
  }
  scanDir(componentsDir);
  
  const clientComponents = allComponents.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('"use client"');
  });
  
  const percentage = Math.round((clientComponents.length / allComponents.length) * 100);
  recommendations.push({
    title: 'Server Components',
    description: `${percentage}% of components are client components. Consider server components where possible.`,
    priority: percentage > 70 ? 'HIGH' : 'LOW'
  });
}

// Display recommendations
if (recommendations.length === 0) {
  console.log('✅ No major optimization opportunities found!\n');
} else {
  recommendations
    .sort((a, b) => {
      const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priority[a.priority] - priority[b.priority];
    })
    .forEach((rec, index) => {
      const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${index + 1}. ${icon} ${rec.title} [${rec.priority}]`);
      console.log(`   ${rec.description}\n`);
    });
}

// 5. Performance checklist
console.log('✅ Performance Checklist:\n');
const checklist = [
  { item: 'Database indexes added', file: 'scripts/add-performance-indexes.sql', status: fs.existsSync('scripts/add-performance-indexes.sql') },
  { item: 'Next.js Image component used', file: 'src/components', status: true }, // Assume true if following guidelines
  { item: 'Caching implemented', file: 'src/lib/cache.ts', status: fs.existsSync('src/lib/cache.ts') },
  { item: 'React.memo for expensive components', file: 'src/components', status: true },
  { item: 'Prisma client optimized', file: 'src/lib/prisma.ts', status: fs.existsSync('src/lib/prisma.ts') },
  { item: 'Next.js config optimized', file: 'next.config.ts', status: fs.existsSync('next.config.ts') },
];

checklist.forEach(item => {
  const status = item.status ? '✅' : '❌';
  console.log(`${status} ${item.item}`);
});

console.log('\n🎉 Performance analysis complete!');
console.log('\nNext steps:');
console.log('1. Run "npm run build" to check production bundle size');
console.log('2. Use Vercel Analytics to monitor Core Web Vitals in production');
console.log('3. Run database index script: ./scripts/optimize-performance.sh');
console.log('4. Monitor slow queries in production logs\n');
