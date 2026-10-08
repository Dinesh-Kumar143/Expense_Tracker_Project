// import { Router } from 'express';
// import { query, validationResult } from 'express-validator';
// import prisma from '../lib/prisma.js';
// import { requireAuth } from '../middleware/auth.js';

// const router = Router();
// router.use(requireAuth);

// function handleValidation(req, res, next) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
//     next();
// }

// // SUMMARY: today / month / year totals, top category, month-over-month comparison
// router.get('/summary', async (req, res) => {
//     const userId = req.user.id;
//     const now = new Date();
//     const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//     const yearStart = new Date(now.getFullYear(), 0, 1);
//     const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

//     const [todayAgg, monthAgg, yearAgg, prevMonthAgg, topCategoryGroup] = await Promise.all([
//         prisma.expense.aggregate({ where: { userId, date: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
//         prisma.expense.aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { amount: true } }),
//         prisma.expense.aggregate({ where: { userId, date: { gte: yearStart } }, _sum: { amount: true } }),
//         prisma.expense.aggregate({ where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
//         prisma.expense.groupBy({
//             by: ['categoryId'],
//             where: { userId, date: { gte: monthStart } },
//             _sum: { amount: true },
//             orderBy: { _sum: { amount: 'desc' } },
//             take: 1,
//         }),
//     ]);

//     const monthTotal = monthAgg._sum.amount ?? 0;
//     const prevMonthTotal = prevMonthAgg._sum.amount ?? 0;
//     const percentChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : null;

//     let topCategory = null;
//     if (topCategoryGroup.length > 0) {
//         const cat = await prisma.category.findUnique({ where: { id: topCategoryGroup[0].categoryId } });
//         const total = topCategoryGroup[0]._sum.amount ?? 0;
//         topCategory = { id: cat.id, name: cat.name, total, percentage: monthTotal > 0 ? (total / monthTotal) * 100 : 0 };
//     }

//     res.json({
//         today: todayAgg._sum.amount ?? 0,
//         month: monthTotal,
//         year: yearAgg._sum.amount ?? 0,
//         topCategory,
//         monthOverMonth: { current: monthTotal, previous: prevMonthTotal, percentChange },
//     });
// });

// // TREND: rolling N months, not capped to the calendar year
// router.get('/trend', [query('months').optional().isInt({ min: 1, max: 24 })], handleValidation, async (req, res) => {
//     const months = parseInt(req.query.months, 10) || 6;
//     const userId = req.user.id;
//     const startDate = new Date();
//     startDate.setMonth(startDate.getMonth() - (months - 1));
//     startDate.setDate(1);
//     startDate.setHours(0, 0, 0, 0);

//     const rows = await prisma.$queryRaw`
//     SELECT date_trunc('month', "date") AS month, SUM("amount")::float AS total
//     FROM "Expense"
//     WHERE "userId" = ${userId} AND "date" >= ${startDate}
//     GROUP BY month
//     ORDER BY month ASC
//   `;

//     res.json({ trend: rows.map((r) => ({ month: r.month, total: r.total })) });
// });

// // DAILY TREND: for a line chart within a given range (defaults to current month)
// router.get('/daily-trend', [query('from').optional().isISO8601(), query('to').optional().isISO8601()], handleValidation, async (req, res) => {
//     const userId = req.user.id;
//     const now = new Date();
//     const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
//     const to = req.query.to ? new Date(req.query.to) : now;

//     const grouped = await prisma.expense.groupBy({
//         by: ['date'],
//         where: { userId, date: { gte: from, lte: to } },
//         _sum: { amount: true },
//         orderBy: { date: 'asc' },
//     });

//     res.json({ daily: grouped.map((g) => ({ date: g.date, total: g._sum.amount ?? 0 })) });
// });

// // CATEGORY BREAKDOWN: for a given range (defaults to current month)
// router.get('/category-breakdown', [query('from').optional().isISO8601(), query('to').optional().isISO8601()], handleValidation, async (req, res) => {
//     const userId = req.user.id;
//     const now = new Date();
//     const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
//     const to = req.query.to ? new Date(req.query.to) : now;

//     const grouped = await prisma.expense.groupBy({
//         by: ['categoryId'],
//         where: { userId, date: { gte: from, lte: to } },
//         _sum: { amount: true },
//         orderBy: { _sum: { amount: 'desc' } },
//     });

//     const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((g) => g.categoryId) } } });
//     const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
//     const total = grouped.reduce((sum, g) => sum + (g._sum.amount ?? 0), 0);

//     res.json({
//         breakdown: grouped.map((g) => ({
//             categoryId: g.categoryId,
//             name: categoryMap[g.categoryId]?.name ?? 'Unknown',
//             amount: g._sum.amount ?? 0,
//             percentage: total > 0 ? ((g._sum.amount ?? 0) / total) * 100 : 0,
//         })),
//         total,
//     });
// });

// // DAY OF WEEK: spending pattern (0 = Sunday ... 6 = Saturday, Postgres convention)
// router.get('/day-of-week', [query('from').optional().isISO8601(), query('to').optional().isISO8601()], handleValidation, async (req, res) => {
//     const userId = req.user.id;
//     const now = new Date();
//     const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth() - 2, 1);
//     const to = req.query.to ? new Date(req.query.to) : now;

//     const rows = await prisma.$queryRaw`
//     SELECT EXTRACT(DOW FROM "date")::int AS day, SUM("amount")::float AS total
//     FROM "Expense"
//     WHERE "userId" = ${userId} AND "date" >= ${from} AND "date" <= ${to}
//     GROUP BY day
//     ORDER BY day ASC
//   `;

//     res.json({ breakdown: rows.map((r) => ({ day: r.day, total: r.total })) });
// });

// export default router;

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { getCached, setCached } from '../utils/cache.js';
import * as analytics from '../services/analyticsService.js';

const router = Router();
router.use(requireAuth);

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

// COMBINED: everything Insights needs, in one request, cached per user for 60s
router.get('/dashboard', async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `dashboard:${userId}`;

    const cached = await getCached(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const [summary, trend, dailyTrend, categoryBreakdown, dayOfWeek, budgets] = await Promise.all([
        analytics.getSummary(userId),
        analytics.getTrend(userId, 6),
        analytics.getDailyTrend(userId),
        analytics.getCategoryBreakdown(userId),
        analytics.getDayOfWeek(userId),
        analytics.getBudgetsWithSpend(userId),
    ]);

    const payload = { summary, trend, dailyTrend, categoryBreakdown, dayOfWeek, budgets };
    await setCached(cacheKey, payload, 60);

    res.json({ ...payload, cached: false });
});

// Individual endpoints kept — useful for custom date ranges Reports-style later
router.get('/summary', async (req, res) => {
    res.json(await analytics.getSummary(req.user.id));
});

router.get('/trend', [query('months').optional().isInt({ min: 1, max: 24 })], handleValidation, async (req, res) => {
    res.json({ trend: await analytics.getTrend(req.user.id, parseInt(req.query.months, 10) || 6) });
});

router.get('/daily-trend', [query('from').optional().isISO8601(), query('to').optional().isISO8601()], handleValidation, async (req, res) => {
    res.json({ daily: await analytics.getDailyTrend(req.user.id, req.query.from, req.query.to) });
});

router.get('/category-breakdown', [query('from').optional().isISO8601(), query('to').optional().isISO8601()], handleValidation, async (req, res) => {
    res.json(await analytics.getCategoryBreakdown(req.user.id, req.query.from, req.query.to));
});

router.get('/day-of-week', [query('from').optional().isISO8601(), query('to').optional().isISO8601()], handleValidation, async (req, res) => {
    res.json({ breakdown: await analytics.getDayOfWeek(req.user.id, req.query.from, req.query.to) });
});

export default router;