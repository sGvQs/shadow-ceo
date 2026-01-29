import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// Next.js automatically loads .env files, so we can use process.env directly
// For Prisma CLI commands, ensure DATABASE_URL is set in your environment
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
