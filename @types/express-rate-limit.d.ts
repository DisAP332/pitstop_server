declare module "express-rate-limit" {
  import { RequestHandler } from "express";

  interface Options {
    windowMs?: number;
    max?: number | ((req: Request, res: Response) => number);
    message?: any;
    statusCode?: number;
    headers?: boolean;
    keyGenerator?: (req: Request, res: Response) => string;
    handler?: (
      req: Request,
      res: Response,
      next: any,
      optionsUsed: Options
    ) => void;
    onLimitReached?: (
      req: Request,
      res: Response,
      optionsUsed: Options
    ) => void;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    requestWasSuccessful?: (req: Request, res: Response) => boolean;
    skip?: (req: Request, res: Response) => boolean;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
  }

  export default function rateLimit(options?: Options): RequestHandler;
}
