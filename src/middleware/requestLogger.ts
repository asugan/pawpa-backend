import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom Morgan format for API logging
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    return JSON.stringify(req.body);
  }
  return '-';
});

const format =
  ':method :url :status :res[content-length] - :response-time ms :body';

export const requestLogger = morgan(format, {
  skip: (req: Request, res: Response) => {
    // Skip logging for health checks in production
    return process.env.NODE_ENV === 'production' && req.url === '/health';
  },
});
