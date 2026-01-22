// Cognito configuration
const config = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  domain: import.meta.env.VITE_COGNITO_DOMAIN,
};

const REDIRECT_URI = `${window.location.origin}/callback`;
const LOGOUT_URI = `${window.location.origin}/login`;

// Token storage keys
const ID_TOKEN_KEY = 'tradesim_id_token';
const ACCESS_TOKEN_KEY = 'tradesim_access_token';
const REFRESH_TOKEN_KEY = 'tradesim_refresh_token';

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface CognitoUser {
  sub: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Check if Cognito is configured
 */
export function isCognitoConfigured(): boolean {
  return !!(config.userPoolId && config.clientId && config.domain);
}

/**
 * Generate the Cognito hosted UI login URL
 */
export function getLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid email phone',
    redirect_uri: REDIRECT_URI,
  });
  
  return `https://${config.domain}/login?${params.toString()}`;
}

/**
 * Generate the Cognito hosted UI signup URL
 */
export function getSignupUrl(): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid email phone',
    redirect_uri: REDIRECT_URI,
  });
  
  return `https://${config.domain}/signup?${params.toString()}`;
}

/**
 * Generate the Cognito logout URL
 */
export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: LOGOUT_URI,
  });
  
  return `https://${config.domain}/logout?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<CognitoTokens> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code: code,
    redirect_uri: REDIRECT_URI,
  });
  
  const response = await fetch(`https://${config.domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  const data = await response.json();
  
  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Store tokens in localStorage
 */
export function storeTokens(tokens: CognitoTokens): void {
  localStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Get stored ID token
 */
export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY);
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Decode JWT payload (without verification)
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  
  let payload = parts[1];
  // Add padding if needed
  const pad = payload.length % 4;
  if (pad) {
    payload += '='.repeat(4 - pad);
  }
  // Replace URL-safe characters
  payload = payload.replace(/-/g, '+').replace(/_/g, '/');
  
  return JSON.parse(atob(payload));
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    const exp = payload.exp as number;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch {
    return true;
  }
}

/**
 * Get current user from ID token
 */
export function getCurrentUser(): CognitoUser | null {
  const idToken = getIdToken();
  if (!idToken || isTokenExpired(idToken)) {
    return null;
  }
  
  try {
    const payload = decodeJwtPayload(idToken);
    return {
      sub: payload.sub as string,
      email: (payload.email as string) || '',
      emailVerified: (payload.email_verified as boolean) || false,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const idToken = getIdToken();
  return !!idToken && !isTokenExpired(idToken);
}