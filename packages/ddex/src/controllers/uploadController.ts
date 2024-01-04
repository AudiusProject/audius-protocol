import { Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const postUploadXml = (dbService: any) => async (req: Request, res: Response) => {
  res.status(200).send('Route not yet implemented'); // TODO
  // TODO: Persist the upload in DB
};
