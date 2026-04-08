// tailwind-init.js
const { execSync } = require("child_process");

execSync("npx tailwindcss init -p", { stdio: "inherit" });