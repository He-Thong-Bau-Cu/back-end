import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLogs, AuditLogsDocument } from 'src/database/schemas/auditLogs.schema';

@Injectable()
export class AuditLogsMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(AuditLogs.name) private auditLogModel: Model<AuditLogsDocument>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', async () => {
      try {
        const { method, originalUrl, ip, body, headers } = req;
        const { statusCode } = res;

        const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        if (!isWriteOperation) return;

        const user = (req as any).user || {};
        const userId = user.userId ? new Types.ObjectId(user.userId) : null;

        const moduleName = originalUrl.split('/').filter(Boolean)[1]?.toUpperCase() || 'UNKNOWN';

        const refId = req.params?.id ? Number(req.params.id) : undefined;

        const auditLog = new this.auditLogModel({
          userId,
          action: method,
          module: moduleName,
          reference_id: refId,
          old_value: res.locals?.oldData || null, // Nếu controller có set
          new_value: res.locals?.newData || body || null,
          ip_address: ip,
          user_agent: headers['user-agent'],
        });

        await auditLog.save();

        const duration = Date.now() - start;
        console.log(`✅ [AUDIT] ${method} ${originalUrl} (${duration}ms)`);

      } catch (error) {
        console.error('❌ Error saving audit log:', error);
      }
    });

    next();
  }
}
