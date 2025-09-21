import { IUser } from "../models/User.js";
import { IChat } from "../models/Chat.js";

declare global {
  namespace Express {
    interface User extends IUser {
      // This property is required to avoid empty interface lint error
      readonly __isExpressUser?: true;
    }
  }
}

export { IUser, IChat };
