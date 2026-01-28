import React from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../hooks/useAuth';

export const AuthDebugPanel: React.FC = () => {
  const { accounts } = useMsal();
  const { role, email, isAuthenticated } = useAuth();

  const persistedRole = typeof window !== 'undefined' ? localStorage.getItem('qollect_role') : null;
  const persistedEmail = typeof window !== 'undefined' ? localStorage.getItem('qollect_email') : null;

  return (
    <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 60, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 10, borderRadius: 8, fontSize: 12, maxWidth: 320 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Auth Debug</div>
      <div><strong>React auth:</strong> {isAuthenticated ? 'yes' : 'no'}</div>
      <div><strong>Role:</strong> {role ?? 'null'}</div>
      <div><strong>Email:</strong> {email ?? 'null'}</div>
      <hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '6px 0' }} />
      <div><strong>Persisted role:</strong> {persistedRole ?? 'null'}</div>
      <div><strong>Persisted email:</strong> {persistedEmail ?? 'null'}</div>
      <hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '6px 0' }} />
      <div style={{ maxHeight: 120, overflow: 'auto' }}>
        <div style={{ fontWeight: 700 }}>MSAL Accounts</div>
        {accounts && accounts.length > 0 ? (
          accounts.map((a: any) => (
            <div key={a.homeAccountId} style={{ marginTop: 6 }}>
              <div><strong>username</strong>: {a.username}</div>
              <div><strong>name</strong>: {a.name ?? '-'} </div>
              <div style={{ wordBreak: 'break-all' }}><strong>localId</strong>: {a.localAccountId}</div>
            </div>
          ))
        ) : (
          <div style={{ marginTop: 6 }}>none</div>
        )}
      </div>
    </div>
  );
};

export default AuthDebugPanel;
