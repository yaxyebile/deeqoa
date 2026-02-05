import { Router } from 'express';
import * as seedController from '../controllers/seedController.js';

const router = Router();
router.post('/', seedController.seedDatabase);
export default router;
