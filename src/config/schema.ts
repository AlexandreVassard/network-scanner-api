import * as Joi from 'joi';

export const configSchema = Joi.object({
  ARP_INTERFACE: Joi.string().optional(),
  PING_DEVICES: Joi.boolean().required(),
  PING_TIMEOUT: Joi.number().required(),
  SCAN_INTERVAL: Joi.number().required(),
  API_PORT: Joi.number().optional(),
  MAX_PING_THREADS: Joi.number().default('10'),
});
