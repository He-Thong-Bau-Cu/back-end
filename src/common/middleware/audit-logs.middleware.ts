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

        // Chỉ log các write operations
        const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        if (!isWriteOperation) return;

        // Chỉ log khi có token (có req.user từ AuthMiddleware)
        const user = (req as any).user;
        if (!user || !user.sub) {
          // Không có token, bỏ qua audit log
          return;
        }

        // Lấy userId từ JWT payload (sub field)
        const userId = new Types.ObjectId(user.sub);

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
        console.log(`✅ [AUDIT] ${method} ${originalUrl} - User: ${user.sub} (${duration}ms)`);

      } catch (error) {
        // Log error nhưng không throw để không ảnh hưởng đến response
        console.error('❌ Error saving audit log:', error);
      }
    });

    next();
  }
}
