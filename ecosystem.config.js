module.exports = {
  apps : [{
    name: 'Open committee',
	
    script: 'npm',
    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  }],

  deploy : {
    staging : {
      user : 'root',
      host : 'soficoop.com',
      ref  : 'origin/dev',
      repo : 'https://github.com/soficoop/open-committee-backend.git',
      path : '/var/www/oc-backend',
      'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.config.js --env staging'
    }
  }
};
