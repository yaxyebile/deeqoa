import { Router } from 'express';
import * as busController from '../controllers/busController.js';

const router = Router();

router.get('/', busController.getAllBuses);
router.get('/admin/:adminId', busController.getBusesByAdminId);
router.get('/:id', busController.getBusById);
router.post('/', busController.createBus);
router.patch('/:id', busController.updateBus);
router.delete('/:id', busController.deleteBus);

export default router;
