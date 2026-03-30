import prisma from '../../config/database';

export class GeoService {
  async getZones() {
    return prisma.zone.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { states: true } } },
    });
  }

  async getStates(zoneId?: string) {
    return prisma.state.findMany({
      where: zoneId ? { zoneId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        zone: { select: { name: true } },
        _count: { select: { lgas: true } },
      },
    });
  }

  async getLgas(stateId?: string) {
    return prisma.lga.findMany({
      where: stateId ? { stateId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        state: { select: { name: true } },
        _count: { select: { wards: true } },
      },
    });
  }

  async getWards(lgaId?: string) {
    return prisma.ward.findMany({
      where: lgaId ? { lgaId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        lga: { select: { name: true } },
        _count: { select: { pollingUnits: true } },
      },
    });
  }

  async getPollingUnits(wardId?: string) {
    return prisma.pollingUnit.findMany({
      where: wardId ? { wardId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        ward: { select: { name: true } },
      },
    });
  }
}

export const geoService = new GeoService();
