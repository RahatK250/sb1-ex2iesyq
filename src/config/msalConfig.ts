import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// Configuration object to be passed to Msal on creation.
// For more info, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
export const msalConfig = {
  auth: {
    // Replace with your Azure AD tenant ID or use 'common' for multi-tenant
    authority: 'https://login.microsoftonline.com/common',
    // Replace with your Azure AD application (client) ID
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_LOGOUT_REDIRECT_URI || '/',
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

// Log MSAL config on startup for debugging
console.log('[msalConfig] Client ID:', import.meta.env.VITE_AZURE_CLIENT_ID);
console.log('[msalConfig] Redirect URI:', import.meta.env.VITE_REDIRECT_URI || window.location.origin);
console.log('[msalConfig] Logout Redirect URI:', import.meta.env.VITE_LOGOUT_REDIRECT_URI || '/');

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ['User.Read', 'email', 'profile', 'openid'],
};

/**
 * An "interactive" request type refers to a request for tokens with a user interaction.
 * Below are the required scopes of the web API the application wishes to call.
 * For more information, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-react-spa/src/authConfig.js
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

// Create the MSAL public client application instance
export const msalInstance = new PublicClientApplication(msalConfig);
