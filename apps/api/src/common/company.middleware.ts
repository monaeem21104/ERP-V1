import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CompanyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const header = req.header('x-company-id');
    if (header) (req as Request & { companyId?: string }).companyId = header;
    next();
  }
}
