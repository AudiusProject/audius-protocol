import { z } from 'zod';

export const savetypeSchema = z.enum(['track', 'playlist', 'album']);
