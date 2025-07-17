import { urls } from "./config/urls.js";

console.log("✅ Generated URLs:");
urls.forEach((u) => {
  console.log(`→ [${u.platform}] ${u.type}: ${u.url}`);
});
