import { check } from 'k6';

const configLocal = JSON.parse(open('../config/config.local.json'));

export const BASE_URL = __ENV.BASE_URL || configLocal.baseUrl;
