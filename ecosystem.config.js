module.exports = {
  apps: [
    {
      name: 'smartchat',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8889,
      },
    },
  ],
};
