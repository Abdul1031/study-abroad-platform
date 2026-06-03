import { Request, Response } from 'express';

export const healthController = {
  check: (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
    });
  },
};
