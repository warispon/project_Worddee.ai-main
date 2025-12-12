const fs = require("fs");
const path = require("path");

const envLocal = path.join(__dirname, "..", ".env.local");
const envExample = path.join(__dirname, "..", ".env.example");

if (!fs.existsSync(envLocal)) {
  fs.copyFileSync(envExample, envLocal);
  console.log(" Created .env.local from .env.example");
}