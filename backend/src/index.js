import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import usersRouter from './routes/users.js';
import busesRouter from './routes/buses.js';
import bookingsRouter from './routes/bookings.js';
import savedRoutesRouter from './routes/savedRoutes.js';
import migrateRouter from './routes/migrate.js';
import statsRouter from './routes/stats.js';
import seedRouter from './routes/seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow any origin (frontend can be on any domain)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.options('*', cors()); // Handle preflight requests

app.use(express.json({ limit: '10mb' }));

// Health check — always responds, even if DB is down
app.get('/', (req, res) => res.json({ service: 'Deeqo Bus API', status: 'running' }));
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use('/api/users', usersRouter);
app.use('/api/buses', busesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/saved-routes', savedRoutesRouter);
app.use('/api/migrate', migrateRouter);
app.use('/api/stats', statsRouter);
app.use('/api/seed', seedRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Start server first, then connect to DB
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Connect to MongoDB (don't crash server if DB fails)
try {
  await connectDB();
  console.log('✅ MongoDB connected');
} catch (err) {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error('Server is running but database is unavailable.');
}
