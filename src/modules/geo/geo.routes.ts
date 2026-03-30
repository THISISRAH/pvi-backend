import { Router } from 'express';
import { geoController } from './geo.controller';

const router = Router();

router.get('/zones', geoController.getZones);
router.get('/states', geoController.getStates);
router.get('/lgas', geoController.getLgas);
router.get('/wards', geoController.getWards);
router.get('/polling-units', geoController.getPollingUnits);

export default router;
