import { z } from 'zod';

export const delist_entitySchema = z.enum(['TRACKS', 'USERS']);
