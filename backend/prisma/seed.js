import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: 'Office Lunch' },
  { name: 'Home Expense' },
  { name: 'Travel' },
  { name: 'Other' },
];

async function main() {
  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: { name: category.name, userId: null },
      });
    }
  }
  console.log('Default categories seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });