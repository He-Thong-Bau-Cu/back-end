import {
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

export interface CustomRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService
  ) {}

  use(req: CustomRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new HttpException(
        { message: "Hết hạn truy cập. Không có token hợp lệ !!!" },
        HttpStatus.UNAUTHORIZED
      );
    }

    // Lấy JWT_SECRET từ ConfigService, fallback về 'supersecretkey' giống như AuthModule
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'supersecretkey';
    if (!jwtSecret) {
      throw new HttpException(
        { message: "JWT_SECRET không được cấu hình." },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      const now = Math.floor(Date.now() / 1000);

      if (!decoded || !decoded.sub) {
        throw new HttpException(
          { message: "Token không hợp lệ hoặc thiếu dữ liệu." },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (decoded.exp && decoded.exp < now) {
        throw new HttpException(
          { message: "Token đã hết hạn." },
          HttpStatus.UNAUTHORIZED
        );
      }

      req.user = decoded;
      next();
    } catch (err: any) {
      // Xử lý các loại lỗi JWT khác nhau
      if (err.name === "TokenExpiredError") {
        throw new HttpException(
          { message: "Token đã hết hạn." },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (err.name === "JsonWebTokenError") {
        throw new HttpException(
          { message: "Token không hợp lệ hoặc signature không đúng." },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (err.name === "NotBeforeError") {
        throw new HttpException(
          { message: "Token chưa có hiệu lực." },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Log lỗi để debug
      console.error('JWT Verification Error:', {
        name: err.name,
        message: err.message,
        jwtSecret: jwtSecret ? 'Set' : 'Not Set',
      });

      throw new HttpException(
        { message: err.message || "Lỗi xác thực token." },
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
