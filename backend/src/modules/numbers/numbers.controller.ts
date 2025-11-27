import express, { Request, Response } from 'express';

const numbersRouter = express.Router();

numbersRouter.get('/numbers', (req: Request, res: Response) => {
  // For now, return an empty array to satisfy the frontend's expectation
  // of data structure. This can be expanded later to fetch from a database.
  res.json({
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 20
    }
  });
});

export { numbersRouter };
