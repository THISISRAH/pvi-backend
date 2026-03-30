import { Request, Response, NextFunction } from 'express';
import { geoService } from './geo.service';
import { sendSuccess } from '../../utils/apiResponse';

export class GeoController {
  async getZones(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await geoService.getZones();
      sendSuccess(res, zones);
    } catch (err) {
      next(err);
    }
  }

  async getStates(req: Request, res: Response, next: NextFunction) {
    try {
      const zoneId = req.query.zone_id as string | undefined;
      const states = await geoService.getStates(zoneId);
      sendSuccess(res, states);
    } catch (err) {
      next(err);
    }
  }

  async getLgas(req: Request, res: Response, next: NextFunction) {
    try {
      const stateId = req.query.state_id as string | undefined;
      const lgas = await geoService.getLgas(stateId);
      sendSuccess(res, lgas);
    } catch (err) {
      next(err);
    }
  }

  async getWards(req: Request, res: Response, next: NextFunction) {
    try {
      const lgaId = req.query.lga_id as string | undefined;
      const wards = await geoService.getWards(lgaId);
      sendSuccess(res, wards);
    } catch (err) {
      next(err);
    }
  }

  async getPollingUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const wardId = req.query.ward_id as string | undefined;
      const pollingUnits = await geoService.getPollingUnits(wardId);
      sendSuccess(res, pollingUnits);
    } catch (err) {
      next(err);
    }
  }
}

export const geoController = new GeoController();
