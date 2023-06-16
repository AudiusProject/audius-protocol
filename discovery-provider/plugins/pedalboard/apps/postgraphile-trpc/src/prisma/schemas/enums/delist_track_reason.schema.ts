import { z } from 'zod';

export const delist_track_reasonSchema = z.enum(['DMCA', 'ACR', 'MANUAL']);
