const { execSync } = require('child_process');

// Detect environment from Vercel environment variable
const environment = process.env.VERCEL_ENV;

if (environment === 'production') {
  console.log("Running production migrations...");
  execSync('npm prisma migrate deploy', { stdio: 'inherit' });
} else if (environment === 'preview') {
  console.log("Running staging migrations for preview environment...");
  execSync('npm prisma migrate deploy reset --force', { stdio: 'inherit' });
} else {
  console.log("No migrations for this environment.");
}