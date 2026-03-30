import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateMe(req.user!.id, req.body);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { users, total } = await usersService.getUsers(req.user!, req.query as any);
      sendPaginated(res, users, total, Number(req.query.page) || 1, Number(req.query.limit) || 20);
    } catch (err) { next(err); }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUser(req.user!, req.params.id, req.body);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUserStatus(
        req.user!, req.params.id, req.body.status,
        req.ip || req.socket.remoteAddress, req.headers['user-agent']
      );
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUserRole(
        req.user!, req.params.id, req.body.role,
        req.ip || req.socket.remoteAddress, req.headers['user-agent']
      );
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.softDeleteUser(
        req.user!, req.params.id,
        req.ip || req.socket.remoteAddress, req.headers['user-agent']
      );
      sendSuccess(res, { message: 'User deactivated' });
    } catch (err) { next(err); }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 20;
      const leaderboard = await usersService.getLeaderboard(req.user!, limit);
      sendSuccess(res, leaderboard);
    } catch (err) { next(err); }
  }
}

export const usersController = new UsersController();
