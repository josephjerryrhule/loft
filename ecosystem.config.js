/**
 * PM2 Ecosystem Configuration for Plesk Deployment
 * 
 * This file configures PM2 process manager to run the Next.js application
 * in production mode on Plesk servers.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 * 
 * Note: Update the 'cwd' path to match your actual domain directory
 */

module.exports = {
  apps: [
    {
      name: 'loft',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/vhosts/yourdomain.com/httpdocs',  // Update this path!
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/www/vhosts/yourdomain.com/logs/pm2-error.log',
      out_file: '/var/www/vhosts/yourdomain.com/logs/pm2-out.log',
      log_file: '/var/www/vhosts/yourdomain.com/logs/pm2-combined.log',
      time: true,
      
      // Advanced options
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart on file changes (disable in production)
      ignore_watch: [
        'node_modules',
        'logs',
        '.next/cache'
      ],
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Max restarts within time window
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
