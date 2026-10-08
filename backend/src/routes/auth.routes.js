import { Router } from "express";
import bycrpt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again later. " }
});

router.post("/signup",
    authLimiter,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage("Valid email is required").normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            const existing = await prisma.user.findUnique({ where: { email } });

            if (existing) {
                return res.status(409).json({ error: "Email already in use" });
            }

            const hashedPassword = await bycrpt.hash(password, 10);

            console.log("hashedPassword: ", hashedPassword);

            const user = await prisma.user.create({
                data: { name, email, password: hashedPassword },
            })

            console.log("user is being create. ")

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            });

            res.status(201).json({
                token,
                user: { id: user.id, name: user.name, email: user.email },
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Unable to create user!" });
        }
    }
)

router.post('/login',
    authLimiter,
    [
        body("email").isEmail().withMessage("Valid email is requried").normalizeEmail(),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true, password: true }
            });

            if (!user) {
                return res.status(401).json({ error: "Invalid email" })
            }

            const validPassword = await bycrpt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ errors: 'Invalid Password' });
            }

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            })

            res.json({
                token,
                user: { id: user.id, name: user.name, email: user.email }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Unable to login, server error!" })
        }
    }
)

router.get("/me",
    requireAuth,
    async (req, res) => {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    }
)
router.put(
    '/me',
    requireAuth,
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email } = req.body;

        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== req.user.id) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
            },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        res.json({ user: updated });
    }
);


export default router;