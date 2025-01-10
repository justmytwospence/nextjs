const { execSync } = require("child_process");

// Detect environment from Vercel environment variable
const environment = process.env.VERCEL_ENV;

if (environment === "production") {
  console.log("Running production migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("./scripts/install-rust.sh", { stdio: "inherit" });
} else if (environment === "preview") {
  console.log("Running staging migrations for preview environment...");
  execSync("npx prisma migrate reset --force", { stdio: "inherit" });
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("./scripts/install-rust.sh", { stdio: "inherit" });
} else {
  console.log("No migrations for this environment.");
}
