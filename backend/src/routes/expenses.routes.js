import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';

import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitizeText } from '../utils/sanitize.js';

import { invalidate } from '../utils/cache.js';

const router = Router();

router.use(requireAuth)

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

router.post('/',
    [
        body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
        body('categoryId').notEmpty().withMessage('categoryId is required'),
        body('date').isISO8601().withMessage('date must be a valid date'),
        body('description').optional().trim().isLength({ max: 300 }),
    ],
    handleValidation,
    async (req, res) => {
        const { amount, categoryId, date, description } = req.body;

        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                OR: [{ userId: null }, { userId: req.user.id }]
            },
        });

        if (!category) {
            return res.status(400).json({ error: "Invalid category" });
        }

        const expense = await prisma.expense.create({
            data: {
                amount,
                categoryId,
                date: new Date(date),
                description: description ? sanitizeText(description) : description,
                userId: req.user.id,
            },
        });
        await invalidate(`dashboard:${req.user.id}`);
        res.status(201).json({ expense });
    }
);


router.get('/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('category').optional().isString(),
        query('from').optional().isISO8601(),
        query('to').optional().isISO8601(),
        query('search').optional().isString().trim(),
    ],
    handleValidation,
    async (req, res) => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        const where = {
            userId: req.user.id,
            ...(req.query.category && { categoryId: req.query.category }),
            ...((req.query.from || req.query.to) && {
                date: {
                    ...(req.query.from && { gte: new Date(req.query.from) }),
                    ...(req.query.to && { lte: new Date(req.query.to) }),
                },
            }),
            ...(req.query.search && {
                description: { contains: req.query.search, mode: 'insensitive' },
            }),
        };

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                include: { category: true },
                orderBy: { date: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.expense.count({ where }),
        ]);

        res.json({
            expenses,
            pagination: { page, limit, total, totalpages: Math.ceil(total / limit) },
        });
    }
);
// GET ONE
router.get('/:id', [param('id').notEmpty()], handleValidation, async (req, res) => {
    const expense = await prisma.expense.findFirst({
        where: { id: req.params.id, userId: req.user.id }, // ownership check
        include: { category: true },
    });

    if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense });
});

// UPDATE
router.put(
    '/:id',
    [
        param('id').notEmpty(),
        body('amount').optional().isFloat({ gt: 0 }),
        body('categoryId').optional().notEmpty(),
        body('date').optional().isISO8601(),
        body('description').optional().trim().isLength({ max: 300 }),
    ],
    handleValidation,
    async (req, res) => {
        const existing = await prisma.expense.findFirst({
            where: { id: req.params.id, userId: req.user.id }, // ownership check
        });

        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const { amount, categoryId, date, description } = req.body;

        const updated = await prisma.expense.update({
            where: { id: existing.id },
            data: {
                ...(amount !== undefined && { amount }),
                ...(categoryId !== undefined && { categoryId }),
                ...(date !== undefined && { date: new Date(date) }),
                ...(sanitizeText(description) !== undefined && { description }),
            },
        });
        await invalidate(`dashboard:${req.user.id}`);
        res.json({ expense: updated });
    }
);

// DELETE
router.delete('/:id', [param('id').notEmpty()], handleValidation, async (req, res) => {
    const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, userId: req.user.id }, // ownership check
    });

    if (!existing) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({ where: { id: existing.id } });
    await invalidate(`dashboard:${req.user.id}`);
    res.status(204).send();
});

export default router;