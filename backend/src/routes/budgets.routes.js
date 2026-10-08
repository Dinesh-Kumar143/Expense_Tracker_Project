// import { Router } from 'express';
// import { body, param, validationResult } from 'express-validator';
// import prisma from '../lib/prisma.js';
// import { requireAuth } from '../middleware/auth.js';

// const router = Router();
// router.use(requireAuth);

// function handleValidation(req, res, next) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
//     next();
// }

// // LIST — includes current-month spend and alert status, computed server-side
// router.get('/', async (req, res) => {
//     const userId = req.user.id;
//     const now = new Date();
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

//     const budgets = await prisma.budget.findMany({ where: { userId }, include: { category: true } });

//     const spendByCategory = await prisma.expense.groupBy({
//         by: ['categoryId'],
//         where: { userId, date: { gte: monthStart } },
//         _sum: { amount: true },
//     });
//     const spendMap = Object.fromEntries(spendByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0]));

//     const result = budgets.map((b) => {
//         const spent = spendMap[b.categoryId] ?? 0;
//         const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
//         return {
//             id: b.id,
//             categoryId: b.categoryId,
//             categoryName: b.category.name,
//             amount: b.amount,
//             spent,
//             percentage,
//             isOverBudget: spent > b.amount,
//             isNearLimit: percentage >= 80 && percentage < 100,
//         };
//     });

//     res.json({ budgets: result });
// });

// // SET (create or update) — one standing monthly budget per category
// router.post('/', [body('categoryId').notEmpty(), body('amount').isFloat({ gt: 0 })], handleValidation, async (req, res) => {
//     const { categoryId, amount } = req.body;

//     const category = await prisma.category.findFirst({
//         where: { id: categoryId, OR: [{ userId: null }, { userId: req.user.id }] },
//     });
//     if (!category) return res.status(400).json({ error: 'Invalid category' });

//     const budget = await prisma.budget.upsert({
//         where: { userId_categoryId: { userId: req.user.id, categoryId } },
//         update: { amount },
//         create: { userId: req.user.id, categoryId, amount },
//     });

//     res.status(201).json({ budget });
// });

// // DELETE
// router.delete('/:categoryId', [param('categoryId').notEmpty()], handleValidation, async (req, res) => {
//     const existing = await prisma.budget.findFirst({ where: { userId: req.user.id, categoryId: req.params.categoryId } });
//     if (!existing) return res.status(404).json({ error: 'Budget not found' });

//     await prisma.budget.delete({ where: { id: existing.id } });
//     res.status(204).send();
// });

// export default router;

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getBudgetsWithSpend } from '../services/analyticsService.js';
import { invalidate } from '../utils/cache.js';

const router = Router();
router.use(requireAuth);

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

router.get('/', async (req, res) => {
    res.json({ budgets: await getBudgetsWithSpend(req.user.id) });
});

router.post('/', [body('categoryId').notEmpty(), body('amount').isFloat({ gt: 0 })], handleValidation, async (req, res) => {
    const { categoryId, amount } = req.body;

    const category = await prisma.category.findFirst({
        where: { id: categoryId, OR: [{ userId: null }, { userId: req.user.id }] },
    });
    if (!category) return res.status(400).json({ error: 'Invalid category' });

    const budget = await prisma.budget.upsert({
        where: { userId_categoryId: { userId: req.user.id, categoryId } },
        update: { amount },
        create: { userId: req.user.id, categoryId, amount },
    });

    await invalidate(`dashboard:${req.user.id}`);

    res.status(201).json({ budget });
});

router.delete('/:categoryId', [param('categoryId').notEmpty()], handleValidation, async (req, res) => {
    const existing = await prisma.budget.findFirst({ where: { userId: req.user.id, categoryId: req.params.categoryId } });
    if (!existing) return res.status(404).json({ error: 'Budget not found' });

    await prisma.budget.delete({ where: { id: existing.id } });
    await invalidate(`dashboard:${req.user.id}`);

    res.status(204).send();
});

export default router;