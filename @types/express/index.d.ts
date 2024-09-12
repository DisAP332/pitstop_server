import { Request } from "express";

declare module "express-serve-static-core" {
  export interface Request {
    isVerified?: boolean;
    userId?: number;
    role?: string;
  }
}
