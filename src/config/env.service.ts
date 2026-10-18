import dotenv from 'dotenv';

dotenv.config({ path: ['.env.dev', '.env.prod'] });

export const env = {
  get port() {
    return process.env.PORT;
  },
};
