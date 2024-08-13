import './configs/instrument';
import express, { type NextFunction, type Request, type Response, type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import compression from 'compression';

import authRoute from './routes/auth.route';
import coursesRoute from './routes/course.route';
import checkoutRoute from './routes/checkout.route';
import studentDashboardRoue from './routes/dashboard.route';
import commentRoute from './routes/comment.route';

import { RouteNowFoundError } from './libs/utils';
import { ErrorMiddleware } from './middlewares/error';

const app : Express = express();

app.use('/api/v1/payments', checkoutRoute); // stripe use express.row
app.use(express.json({limit : '10mb'}));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use(cors({credentials : true}));
app.use(compression());

app.all('/', (req : Request, res : Response) => res.status(200).json({success : true, message : 'Welcome'}));

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/courses', coursesRoute);
app.use('/api/v1/student/dashboard', studentDashboardRoue);
app.use('/api/v1/comments', commentRoute)

app.all('*', (req : Request, res : Response, next : NextFunction) => {
    next(new RouteNowFoundError(`Route : ${req.originalUrl} not found`));
});

app.use(ErrorMiddleware);
export default app;