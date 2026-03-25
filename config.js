import Config from 'react-native-config';

// Set the API URLs
export const API_URL = Config.DEV_API;
export const AUTH_API_URL = Config.AUTH_API_URL || Config.PROD_AUTH_API || Config.DEV_API;

// Avoid logging config values (especially in production).

// export const AWS_ID = Config.AWS_ACCESS_KEY_ID;
// export const AWS_Secret = Config.AWS_SECRET_ACCESS_KEY;
// export const AWS_Region = Config.AWS_REGION;
