import { z } from 'zod';

export const wallet_chainSchema = z.enum(['eth', 'sol']);
