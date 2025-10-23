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

export interface CustomRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new HttpException(
        { message: "Hết hạn truy cập. Không có token hợp lệ !!!" },
        HttpStatus.UNAUTHORIZED
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const now = Math.floor(Date.now() / 1000);
      if (!decoded || !decoded.sub || !decoded.role) {
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
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new HttpException(
          { message: "Token đã hết hạn." },
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(
        { message: "Token không hợp lệ." },
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
