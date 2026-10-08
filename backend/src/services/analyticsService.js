import prisma from '../lib/prisma.js';

export async function getSummary(userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [todayAgg, monthAgg, yearAgg, prevMonthAgg, topCategoryGroup] = await Promise.all([
        prisma.expense.aggregate({ where: { userId, date: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: yearStart } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
        prisma.expense.groupBy({
            by: ['categoryId'],
            where: { userId, date: { gte: monthStart } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 1,
        }),
    ]);

    const monthTotal = monthAgg._sum.amount ?? 0;
    const prevMonthTotal = prevMonthAgg._sum.amount ?? 0;
    const percentChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : null;

    let topCategory = null;
    if (topCategoryGroup.length > 0) {
        const cat = await prisma.category.findUnique({ where: { id: topCategoryGroup[0].categoryId } });
        const total = topCategoryGroup[0]._sum.amount ?? 0;
        topCategory = { id: cat.id, name: cat.name, total, percentage: monthTotal > 0 ? (total / monthTotal) * 100 : 0 };
    }

    return {
        today: todayAgg._sum.amount ?? 0,
        month: monthTotal,
        year: yearAgg._sum.amount ?? 0,
        topCategory,
        monthOverMonth: { current: monthTotal, previous: prevMonthTotal, percentChange },
    };
}

export async function getTrend(userId, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw`
    SELECT date_trunc('month', "date") AS month, SUM("amount")::float AS total
    FROM "Expense"
    WHERE "userId" = ${userId} AND "date" >= ${startDate}
    GROUP BY month
    ORDER BY month ASC
  `;
    return rows.map((r) => ({ month: r.month, total: r.total }));
}

export async function getDailyTrend(userId, from, to) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : now;

    const grouped = await prisma.expense.groupBy({
        by: ['date'],
        where: { userId, date: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
        orderBy: { date: 'asc' },
    });
    return grouped.map((g) => ({ date: g.date, total: g._sum.amount ?? 0 }));
}

export async function getCategoryBreakdown(userId, from, to) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : now;

    const grouped = await prisma.expense.groupBy({
        by: ['categoryId'],
        where: { userId, date: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
    });

    const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((g) => g.categoryId) } } });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const total = grouped.reduce((sum, g) => sum + (g._sum.amount ?? 0), 0);

    return {
        breakdown: grouped.map((g) => ({
            categoryId: g.categoryId,
            name: categoryMap[g.categoryId]?.name ?? 'Unknown',
            amount: g._sum.amount ?? 0,
            percentage: total > 0 ? ((g._sum.amount ?? 0) / total) * 100 : 0,
        })),
        total,
    };
}

export async function getDayOfWeek(userId, from, to) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const toDate = to ? new Date(to) : now;

    const rows = await prisma.$queryRaw`
    SELECT EXTRACT(DOW FROM "date")::int AS day, SUM("amount")::float AS total
    FROM "Expense"
    WHERE "userId" = ${userId} AND "date" >= ${fromDate} AND "date" <= ${toDate}
    GROUP BY day
    ORDER BY day ASC
  `;
    return rows.map((r) => ({ day: r.day, total: r.total }));
}

export async function getBudgetsWithSpend(userId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const budgets = await prisma.budget.findMany({ where: { userId }, include: { category: true } });

    const spendByCategory = await prisma.expense.groupBy({
        by: ['categoryId'],
        where: { userId, date: { gte: monthStart } },
        _sum: { amount: true },
    });
    const spendMap = Object.fromEntries(spendByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0]));

    return budgets.map((b) => {
        const spent = spendMap[b.categoryId] ?? 0;
        const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return {
            id: b.id,
            categoryId: b.categoryId,
            categoryName: b.category.name,
            amount: b.amount,
            spent,
            percentage,
            isOverBudget: spent > b.amount,
            isNearLimit: percentage >= 80 && percentage < 100,
        };
    });
}