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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/buses', busesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/saved-routes', savedRoutesRouter);
app.use('/api/migrate', migrateRouter);
app.use('/api/stats', statsRouter);
app.use('/api/seed', seedRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
