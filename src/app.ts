import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import authRoute from './routes/auth.route';

import { RouteNowFoundError } from './libs/utils';
import { ErrorMiddleware } from './middlewares/error';
import { rateLimit } from './middlewares/rate-limit';

const app = express();

app.use(express.json({limit : '10mb'}));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use(cors({credentials : true}));
app.use(helmet());
app.use(helmet({crossOriginResourcePolicy : {policy : 'cross-origin'}}));
app.use(compression());

// app.use((req: Request, res: Response, next: NextFunction) => {
//     const rateLimit = RedisRateLimiter.getInstance(undefined);
//     res.locals.rateLimit = rateLimit;
//     next();
// });


app.get('/', rateLimit(1000), (req : Request, res : Response) => res.status(200).json({success : true, message : 'Welcome'}));

app.use('/api/v1/auth', authRoute);

app.all('*', rateLimit(100), (req : Request, res : Response, next : NextFunction) => {
    next(new RouteNowFoundError(`Route : ${req.originalUrl} not found`));
});

app.use(ErrorMiddleware);
export default app;