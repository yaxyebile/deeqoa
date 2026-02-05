import { Router } from 'express';
import * as savedRouteController from '../controllers/savedRouteController.js';

const router = Router();

router.get('/', savedRouteController.getAllSavedRoutes);
router.get('/user/:userId', savedRouteController.getSavedRoutesByUserId);
router.post('/', savedRouteController.createSavedRoute);
router.delete('/:id', savedRouteController.deleteSavedRoute);

export default router;
