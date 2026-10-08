import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getCached, setCached, invalidate } from '../utils/cache.js';

const router = Router();

router.use(requireAuth);

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

// LIST — defaults (userId: null) + this user's own
// router.get('/', async (req, res) => {
//     const categories = await prisma.category.findMany({
//         where: { OR: [{ userId: null }, { userId: req.user.id }] },
//         orderBy: { name: 'asc' },
//     });

//     res.json({ categories });
// });

router.get('/', async (req, res) => {
    const cacheKey = `categories:${req.user.id}`;
    const cached = await getCached(cacheKey);
    if (cached) return res.json({ categories: cached });

    const categories = await prisma.category.findMany({
        where: { OR: [{ userId: null }, { userId: req.user.id }] },
        orderBy: { name: 'asc' },
    });

    await setCached(cacheKey, categories, 300); // 5 min — categories change rarely

    res.json({ categories });
});

// CREATE (custom category)
router.post(
    '/',
    [body('name').trim().notEmpty().withMessage('Name is required')],
    handleValidation,
    async (req, res) => {
        const { name, color } = req.body;

        const existing = await prisma.category.findFirst({
            where: { name, userId: req.user.id },
        });

        if (existing) {
            return res.status(409).json({ error: 'Category already exists' });
        }

        const category = await prisma.category.create({
            data: { name: sanitizeText(name), color, userId: req.user.id },
        });
        await invalidate(`categories:${req.user.id}`, `dashboard:${req.user.id}`);
        res.status(201).json({ category });
    }
);

// DELETE (only your own custom categories — defaults are protected)
router.delete('/:id', [param('id').notEmpty()], handleValidation, async (req, res) => {
    const { reassignTo } = req.body;

    const category = await prisma.category.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });

    if (!category) {
        return res.status(404).json({ error: 'Category not found or cannot be deleted' });
    }

    const expenseCount = await prisma.expense.count({ where: { categoryId: category.id } });

    if (expenseCount > 0) {
        if (!reassignTo) {
            return res.status(409).json({
                error: 'Category has expenses',
                expenseCount,
            });
        }

        const target = await prisma.category.findFirst({
            where: { id: reassignTo, OR: [{ userId: null }, { userId: req.user.id }] },
        });
        if (!target) {
            return res.status(400).json({ error: 'Invalid reassignTo category' });
        }

        await prisma.$transaction([
            prisma.expense.updateMany({
                where: { categoryId: category.id, userId: req.user.id },
                data: { categoryId: reassignTo },
            }),
            prisma.category.delete({ where: { id: category.id } }),
        ]);

        return res.status(204).send();
    }

    await prisma.category.delete({ where: { id: category.id } });
    await invalidate(`categories:${req.user.id}`, `dashboard:${req.user.id}`);
    res.status(204).send();
});

export default router;