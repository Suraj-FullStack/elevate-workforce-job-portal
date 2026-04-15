module.exports = {
  apps: [
    {
      name: 'elevate-api',
      script: 'src/server.js',
      cwd: '/home/user/webapp/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M'
    }
  ]
};
