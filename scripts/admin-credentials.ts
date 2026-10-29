// Prints the .env lines for the owner account: `npm run admin:credentials -- "parola-lungă"`.
import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/lib/password";

async function main() {
  const password = process.argv[2];
  if (!password || password.length < 12) {
    console.error('Folosire: npm run admin:credentials -- "o parolă de cel puțin 12 caractere"');
    process.exit(1);
  }
  console.log(`ADMIN_PASSWORD_HASH="${await hashPassword(password)}"`);
  console.log(`AUTH_SECRET="${randomBytes(32).toString("base64url")}"`);
}

void main();
