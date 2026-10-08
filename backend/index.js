import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './src/routes/auth.routes.js';
import expensesRoutes from './src/routes/expenses.routes.js';
import categoriesRoutes from './src/routes/categories.routes.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import budgetsRoutes from './src/routes/budgets.routes.js';
import compression from 'compression';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin header = native app / curl / Postman, not a browser - allow it.
      // A browser-sent origin must be in the explicit allowlist.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(express.json());

// General rate limiting across the whole API, not just auth
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});