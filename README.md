# Mega Cat Labs Playground

This project is the backend API for Mega Cat Labs Marketplace.

## Getting Started

Please start API Server along Cronjobs if you want.

### API Server (in separate terminal)

```javascript

// 1A Use Staging MongoDB
// Do nothing; its already setup for this.

// 1B (Optional) Setup local MongoDB
mkdir db && mkdir logs
mongod --fork --logpath ./logs/log --dbpath ./db

// Run Backend REST API
npm run start-dev

// Run local 'staging/production' setup: transpiles from TS to JS and runs from artifact
npm run start

// Run Backend against Mega Cat Lab's staging environment
npm run staging

// Run backend against BookCoin's staging environment
npm run bkcn-staging
```

### Cron Jobs (in separate terminal)

Cron jobs are a seperate node process. Following npm scripts are self descriptive.

- `npm run start:cron:mcl:dev`
- `npm run start:cron:mcl:staging`
- `npm run start:cron:mcl:production`
- `npm run start:cron:bkcn:dev`
- `npm run start:cron:bkcn:staging`
- `npm run start:cron:bkcn:production`

## Building Docker containers

```
docker build -t megacatlabs/playground:0.1.0 .
```

## Deploying to Heroku

```
npm run build
git push heroku main
```
