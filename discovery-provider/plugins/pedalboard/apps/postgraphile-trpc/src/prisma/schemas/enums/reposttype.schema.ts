import { z } from 'zod';

export const reposttypeSchema = z.enum(['track', 'playlist', 'album']);
