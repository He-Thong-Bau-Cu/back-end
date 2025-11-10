import { Users } from "src/database/schemas/users.schema";
import { CustomRequest } from "../middleware/auth.middleware";

export function getLoggerUserId(req: CustomRequest): any {
  return req.user.sub;
}
