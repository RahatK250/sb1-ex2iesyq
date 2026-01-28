# Office 365 Authentication Setup Guide

This application now supports Office 365 login. Follow these steps to set up Office 365 authentication:

## Prerequisites

1. An Azure AD tenant (part of Microsoft 365)
2. Administrator access to Azure Portal
3. A registered application in Azure AD

## Step 1: Register your Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Fill in the application details:
   - **Name**: Your application name (e.g., "Qollect")
   - **Supported account types**: Select "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
   - **Redirect URI**: Web - `http://localhost:5173` (for development)
4. Click **Register**

## Step 2: Configure the Application

### Get Client ID
1. In your app registration, go to **Overview**
2. Copy the **Application (client) ID** - you'll need this as `VITE_AZURE_CLIENT_ID`

### Configure Redirect URIs
1. Go to **Authentication** in the left menu
2. Under **Redirect URIs**, add:
   - `http://localhost:5173` (for local development)
   - Your production URL (e.g., `https://yourapp.com`)
3. Check **Treat as public client** ✓
4. Click **Save**

### Configure API Permissions
1. Go to **API permissions** in the left menu
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Search for and add:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`
6. Click **Add permissions**

## Step 3: Set Environment Variables

Create a `.env.local` file in the root of your project:

```env
VITE_AZURE_CLIENT_ID=your_client_id_here
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

Replace `your_client_id_here` with the Application ID you copied from Azure.

## Step 4: Run the Application

```bash
npm run dev
```

## How Office 365 Login Works

1. User clicks **"Sign in with Office 365"** button on the login page
2. Browser redirects to Microsoft login
3. After successful authentication, the app extracts the user's email
4. The user is automatically assigned the **admin** role
5. User is redirected to the home page

## Features

- **Automatic Admin Role**: All Office 365 users are assigned admin role by default
- **Email Capture**: User's email is extracted from Office 365 and stored
- **Session Persistence**: Login session is stored in localStorage
- **Dark Mode Support**: Login page supports dark/light theme

## Troubleshooting

### "CORS Policy" Error
- Ensure your redirect URI in Azure matches exactly with your application URL
- Check that the redirect URI protocol (http/https) matches

### "User Cancelled Login"
- User closed the Microsoft login popup - this is normal, try again

### Email Not Appearing
- Check browser console for errors
- Ensure the `User.Read` and `email` permissions are granted in Azure

## API Reference

The `loginWithOffice365` function accepts:

```typescript
loginWithOffice365(accountInfo: {
  mail: string;           // User's email from Office 365
  userPrincipalName: string;  // User's principal name
})
```

## For Production

1. Update redirect URIs to your production domain
2. Add production URL to Azure App registration
3. Update `.env.local` with production URLs
4. Test thoroughly before deploying

## Additional Resources

- [Microsoft Authentication Library (MSAL) Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [MSAL React Integration](https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react)
