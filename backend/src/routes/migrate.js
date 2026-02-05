import { Router } from 'express';
import * as migrateController from '../controllers/migrateController.js';

const router = Router();
router.post('/', migrateController.migrateFromLocalStorage);
export default router;
