# 📊 Office 365 Integration - Visual Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Qollect Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              MsalProvider (NEW)                    │   │
│  │  (Manages Office 365 Authentication)              │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │         Router & AuthProvider                │ │   │
│  │  │                                              │ │   │
│  │  │  ┌────────────────────────────────────────┐ │ │   │
│  │  │  │      Login Page / AuthModal            │ │ │   │
│  │  │  │                                        │ │ │   │
│  │  │  │  ┌──────────────────────────────────┐ │ │ │   │
│  │  │  │  │ Traditional Email/Password Form  │ │ │ │   │
│  │  │  │  └──────────────────────────────────┘ │ │ │   │
│  │  │  │                                        │ │ │   │
│  │  │  │  ┌──────────────────────────────────┐ │ │ │   │
│  │  │  │  │ Office 365 Login Button (NEW)   │ │ │ │   │
│  │  │  │  │         [Sign in with Office 365]│ │ │ │   │
│  │  │  │  └──────────────────────────────────┘ │ │ │   │
│  │  │  └────────────────────────────────────────┘ │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │  Azure AD (Microsoft)         │
            │  - User Authentication        │
            │  - Email & Profile Retrieval  │
            │  - Token Management           │
            └───────────────────────────────┘
```

## Login Flow Comparison

### Traditional Login (Original)
```
User Input Email/Password
        │
        ▼
Verify against hardcoded credentials
        │
        ▼
Set Role (admin/reporter)
        │
        ▼
Save to localStorage
        │
        ▼
Redirect to Home
```

### Office 365 Login (New)
```
Click "Sign in with Office 365"
        │
        ▼
MSAL loginPopup() opens
        │
        ▼
User authenticates with Microsoft
        │
        ▼
Microsoft returns account info (email, UPN)
        │
        ▼
loginWithOffice365() in useAuth
        │
        ▼
Set Role to 'admin' (automatic)
        │
        ▼
Save email & auth method to localStorage
        │
        ▼
Redirect to Home
```

## Component Hierarchy

```
App.tsx
├── MsalProvider (NEW)
│   └── Router
│       └── AuthProvider
│           ├── HomePage
│           ├── DataPage
│           ├── SettingsPage (Protected: admin only)
│           └── LoginPage
│               └── AuthModal (UPDATED)
│                   ├── Traditional Form (existing)
│                   ├── Divider
│                   └── Office 365 Button (NEW)
```

## Data Flow

```
Office 365 Login Flow:
─────────────────────

AuthModal.tsx
    │
    ├─ Click Office 365 button
    │
    ▼
handleOffice365Login()
    │
    ├─ Check if user already authenticated
    │   (No) → loginPopup()
    │   (Yes) → Extract account info from MSAL
    │
    ▼
Get Account Info: {
    mail: "user@company.com",
    userPrincipalName: "user@company.onmicrosoft.com"
}
    │
    ▼
loginWithOffice365(accountInfo) [useAuth.tsx]
    │
    ├─ Extract email from account
    ├─ Set role = 'admin'
    ├─ Save to localStorage:
    │   - qollect_email
    │   - qollect_role = 'admin'
    │   - qollect_auth_method = 'office365'
    │
    ▼
Return { ok: true }
    │
    ▼
navigate('/')
    │
    ▼
User can see email in UI
```

## File Structure Changes

```
src/
├── config/
│   └── msalConfig.ts (NEW)
│       ├── MSAL Configuration
│       ├── Authority & ClientId
│       ├── Login Request Scopes
│       └── msalInstance export
│
├── hooks/
│   ├── useAuth.tsx (UPDATED)
│   │   ├── loginWithOffice365() (NEW)
│   │   └── AuthContextValue interface (UPDATED)
│   └── ...
│
├── components/
│   ├── AuthModal.tsx (UPDATED)
│   │   ├── handleOffice365Login() (NEW)
│   │   ├── Office 365 Button (NEW)
│   │   └── Divider (NEW)
│   └── ...
│
├── App.tsx (UPDATED)
│   └── <MsalProvider> wrapper (NEW)
│
└── ...

Files Added:
├── .env (created/updated)
├── OFFICE365_SETUP.md (guidance)
└── QUICK_START.md (quick reference)
```

## Environment Variables

```
.env (Project Root)
────────────────────

VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-key>

# Office 365 Configuration (NEW)
VITE_AZURE_CLIENT_ID=<azure-app-client-id>
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

## Key Features

```
┌─────────────────────────────────────────────┐
│         Office 365 Login Features           │
├─────────────────────────────────────────────┤
│ ✓ Popup-based authentication                │
│ ✓ Automatic admin role assignment           │
│ ✓ Email capture & display                   │
│ ✓ Token management via MSAL                 │
│ ✓ Persistent login state                    │
│ ✓ Logout support                            │
│ ✓ Error handling & user feedback            │
│ ✓ Dark mode compatible UI                   │
└─────────────────────────────────────────────┘
```

## User Experience

### Before (Traditional Login Only)
```
Login Page
├── Email input
├── Password input
└── Sign in button
```

### After (With Office 365)
```
Login Page
├── Email input
├── Password input
├── Sign in button
├── ─── OR ───  (visual divider)
├── Office 365 icon
└── Sign in with Office 365 button
```

## Dependencies Added

```
@azure/msal-browser (v3.x+)
├── Core authentication
├── Token management
└── Platform-specific APIs

@azure/msal-react (v2.x+)
├── React hooks (useMsal)
├── Provider component (MsalProvider)
└── React integration
```

## Security Notes

✓ Client ID in environment variables (not hardcoded)
✓ MSAL handles token storage securely
✓ No password transmission to custom backend
✓ OAuth 2.0 / OpenID Connect compliance
✓ Email only stored in localStorage (no sensitive data)
