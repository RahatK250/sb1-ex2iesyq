# Office 365 Login Usage Examples

## Quick Start

### 1. Basic Setup (Development)

```bash
# Create .env.local file
cat > .env.local << EOF
VITE_AZURE_CLIENT_ID=your-client-id-from-azure
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
EOF

# Start development server
npm run dev
```

### 2. Using Office 365 Login

**In Browser:**
1. Navigate to `http://localhost:5173/login`
2. Click **"Sign in with Office 365"** button
3. Enter your Microsoft/Office 365 credentials
4. You'll be automatically assigned admin role
5. Your email will be displayed in the app

## Code Examples

### Accessing Authenticated User Data

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { email, role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login first</p>;
  }

  return (
    <div>
      <p>Welcome, {email}!</p>
      <p>Your role: {role}</p>
    </div>
  );
}
```

### Manual Office 365 Login

```tsx
import { useAuth } from '../hooks/useAuth';
import { useMsal } from '@azure/msal-react';

function CustomLoginButton() {
  const { loginWithOffice365 } = useAuth();
  const { instance, accounts } = useMsal();

  const handleLogin = async () => {
    try {
      const loginRequest = {
        scopes: ['User.Read', 'email', 'profile', 'openid'],
      };

      const response = await instance.loginPopup(loginRequest);

      if (response.account) {
        const res = await loginWithOffice365({
          mail: response.account.idTokenClaims?.email || '',
          userPrincipalName: response.account.username || '',
        });

        if (res.ok) {
          console.log('Login successful!');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <button onClick={handleLogin}>Login with Office 365</button>;
}
```

### Logout

```tsx
import { useAuth } from '../hooks/useAuth';
import { useMsal } from '@azure/msal-react';

function LogoutButton() {
  const { logout } = useAuth();
  const { instance } = useMsal();

  const handleLogout = async () => {
    logout();
    await instance.logoutPopup();
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protecting Routes

```tsx
import ProtectedRoute from '../components/ProtectedRoute';
import AdminPanel from './AdminPanel';

function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

## Configuration Examples

### Development Environment

```env
VITE_AZURE_CLIENT_ID=1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Production Environment

```env
VITE_AZURE_CLIENT_ID=your-production-client-id
VITE_REDIRECT_URI=https://yourapp.com
VITE_LOGOUT_REDIRECT_URI=https://yourapp.com/login
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Customizing User Role Assignment

If you want different roles for different users, modify `src/hooks/useAuth.tsx`:

```tsx
const loginWithOffice365 = async (accountInfo: { mail: string; userPrincipalName: string }) => {
  try {
    const userEmail = accountInfo.mail || accountInfo.userPrincipalName;
    
    if (!userEmail) {
      return { ok: false, message: 'Unable to retrieve email from Office 365 account' };
    }

    // Custom role assignment based on email domain
    let userRole: Role = 'reporter'; // Default role
    
    if (userEmail.endsWith('@gofive.co.th')) {
      userRole = 'admin'; // Admin for company email
    }

    setRole(userRole);
    setEmail(userEmail);
    try { 
      localStorage.setItem('qollect_role', userRole);
      localStorage.setItem('qollect_email', userEmail);
      localStorage.setItem('qollect_auth_method', 'office365');
    } catch (e) {}
    
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Office 365 login failed' };
  }
};
```

## Displaying User Information

```tsx
import { useAuth } from '../hooks/useAuth';

function UserProfile() {
  const { email, role } = useAuth();

  return (
    <div className="user-profile">
      <h3>User Profile</h3>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Role:</strong> {role}</p>
      <p><strong>Auth Method:</strong> Office 365</p>
    </div>
  );
}
```

## Debugging

### Check Stored Session Data

```javascript
// In browser console
console.log('Email:', localStorage.getItem('qollect_email'));
console.log('Role:', localStorage.getItem('qollect_role'));
console.log('Auth Method:', localStorage.getItem('qollect_auth_method'));
```

### View MSAL Logs

MSAL logs are automatically logged to console (development mode).

### Test Authentication Flow

```tsx
function TestAuth() {
  const { isAuthenticated, email, role } = useAuth();

  return (
    <div>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Email: {email || 'N/A'}</p>
      <p>Role: {role || 'N/A'}</p>
    </div>
  );
}
```

## Troubleshooting Common Issues

### Issue: "Cannot find module '@azure/msal-react'"
**Solution:** Run `npm install @azure/msal-browser @azure/msal-react --legacy-peer-deps`

### Issue: "Invalid redirect URI"
**Solution:** Ensure the redirect URI in `.env.local` matches exactly what's configured in Azure AD app registration

### Issue: "User cancelled the operation"
**Solution:** This is normal - user closed the Microsoft login popup. Try again.

### Issue: Email is null/undefined
**Solution:** Ensure `User.Read` and `email` permissions are granted in Azure AD app registration

### Issue: "CORS Policy" error
**Solution:** 
- Check the redirect URI is correctly configured
- Ensure HTTPS is used in production
- Add your domain to the Azure AD app registration

## Advanced Configuration

### Custom Login Request

```tsx
const customLoginRequest = {
  scopes: ['User.Read', 'email', 'profile', 'openid'],
  prompt: 'select_account', // Force account selection
  loginHint: 'user@example.com', // Pre-fill email
};

const response = await instance.loginPopup(customLoginRequest);
```

### Silent Token Acquisition

```tsx
import { useMsal } from '@azure/msal-react';

function MyComponent() {
  const { instance } = useMsal();

  const getToken = async () => {
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ['User.Read', 'email'],
        account: instance.getActiveAccount()!,
      });
      console.log('Token:', response.accessToken);
    } catch (error) {
      console.error('Failed to acquire token:', error);
    }
  };

  return <button onClick={getToken}>Get Token</button>;
}
```

## Best Practices

✅ Always check `isAuthenticated` before rendering protected content  
✅ Store sensitive data in sessionStorage instead of localStorage for prod  
✅ Implement token refresh for long-lived sessions  
✅ Clear auth data on logout  
✅ Handle network errors gracefully  
✅ Log authentication events for debugging  
✅ Use HTTPS in production  
✅ Validate email format before storing  

---

For more information, see [OFFICE365_AUTH_SETUP.md](./OFFICE365_AUTH_SETUP.md)
