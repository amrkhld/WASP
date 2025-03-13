module.exports = {
  apps: [
    {
      name: 'next-app',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      exp_backoff_restart_delay: 100
    },
    {
      name: 'socket-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      exp_backoff_restart_delay: 100,
      merge_logs: true,
      error_file: 'logs/socket-error.log',
      out_file: 'logs/socket-out.log'
    }
  ],
  
  deploy: {
    production: {
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};