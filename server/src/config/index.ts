import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
  };
  cognito: {
    userPoolId: string;
    clientId: string;
    region: string;
  };
  finnhub: {
    apiKey: string;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config: Config = {
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  database: {
    host: optionalEnv('DB_HOST', 'localhost'),
    port: parseInt(optionalEnv('DB_PORT', '5432'), 10),
    name: optionalEnv('DB_NAME', 'stock_simulator'),
    user: optionalEnv('DB_USER', 'postgres'),
    password: optionalEnv('DB_PASSWORD', ''),
    url: optionalEnv(
      'DATABASE_URL',
      `postgresql://${optionalEnv('DB_USER', 'postgres')}:${optionalEnv('DB_PASSWORD', '')}@${optionalEnv('DB_HOST', 'localhost')}:${optionalEnv('DB_PORT', '5432')}/${optionalEnv('DB_NAME', 'stock_simulator')}`
    ),
  },

  cognito: {
    userPoolId: optionalEnv('COGNITO_USER_POOL_ID', ''),
    clientId: optionalEnv('COGNITO_CLIENT_ID', ''),
    region: optionalEnv('COGNITO_REGION', 'us-east-1'),
  },

  finnhub: {
    apiKey: optionalEnv('FINNHUB_API_KEY', ''),
  },
};

export default config;
