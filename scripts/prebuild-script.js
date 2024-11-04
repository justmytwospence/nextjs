import { execSync } from 'child_process';

// Detect environment from Vercel environment variable
const environment = process.env.VERCEL_ENV;

if (environment === 'production') {
  console.log("Running production migrations...");
  execSync('npm run migrate:prod', { stdio: 'inherit' });
} else if (environment === 'preview') {
  console.log("Running staging migrations for preview environment...");
  execSync('npm run migrate:staging', { stdio: 'inherit' });
} else {
  console.log("No migrations for this environment.");
}