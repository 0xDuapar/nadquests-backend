import Joi from 'joi';

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  SESSION_SECRET: Joi.string().min(32).required(),
  TWITTER_CONSUMER_KEY: Joi.string().required(),
  TWITTER_CONSUMER_SECRET: Joi.string().required(),
  TWITTER_BEARER_TOKEN: Joi.string().required(),
  TWITTER_CLIENT_ID: Joi.string().required(),
  TWITTER_CLIENT_SECRET: Joi.string().required(),
  CALLBACK_URL: Joi.string().uri().required(),
  ORIGIN: Joi.string().uri().required(),
  DB_USER: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  PRIVATE_KEY: Joi.string().required(),
}).unknown(); // Allow additional variables

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  console.error(`Config validation error: ${error.message}`);
  process.exit(1); // Exit the application
}

export default envVars;
