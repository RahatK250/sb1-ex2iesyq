# 🔧 How to Fix the Office 365 Login Error

## ❌ Problem

```
AADSTS700016: Application with identifier 'YOUR_CLIENT_ID_HERE' was not found
```

## ✅ Solution

The error occurs because the app is using a placeholder Client ID. Follow these exact steps:

---

## Step 1: Go to Azure Portal

**URL:** https://portal.azure.com

**Action:** Log in with your Microsoft account (admin account recommended)

---

## Step 2: Register a New Application

1. ในสาขา search ด้านบน ค้นหา: **"App registrations"**
2. คลิก **"App registrations"**
3. คลิก **"+ New registration"** (สีน้ำเงิน)

---

## Step 3: Fill in Application Details

**หน้า "Register an application"**

| Field | Value |
|-------|-------|
| **Name** | `Qollect` |
| **Supported account types** | `Accounts in any organizational directory (Any Azure AD directory - Multitenant)` |
| **Redirect URI (optional)** | Platform: `Web` → URI: `http://localhost:5173` |

4. คลิก **"Register"** (สีน้ำเงิน)

---

## Step 4: Copy Your Client ID

**หลังจากสมัครสมาชิก จะเห็นหน้า Overview**

ค้นหา: **"Application (client) ID"**

➡️ **คัดลอก** ID นี้ (ยาว ๆ UUID)

ตัวอย่าง: `12345678-1234-1234-1234-123456789012`

---

## Step 5: Add API Permissions

**ไป:** Left sidebar → **"API permissions"**

1. คลิก **"+ Add a permission"**
2. เลือก **"Microsoft Graph"**
3. เลือก **"Delegated permissions"**
4. ค้นหาและเลือก:
   - ✓ `email`
   - ✓ `profile`
   - ✓ `User.Read`
   - ✓ `openid`
5. คลิก **"Add permissions"** ที่ด้านล่าง

---

## Step 6: Update Your .env File

**ไฟล์:** `<project-root>/.env`

```env
# Existing Supabase config (ตามที่มี)
VITE_SUPABASE_URL=your-existing-url
VITE_SUPABASE_ANON_KEY=your-existing-key

# Add these new lines:
VITE_AZURE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

**ตัวอย่าง:**
```env
VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789012
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

---

## Step 7: Restart Development Server

```bash
# หยุด server (ถ้ากำลังรัน)
# กด Ctrl+C ในเทอร์มินัล

# รัน development server ใหม่
npm run dev
```

✅ Server should restart at `http://localhost:5173`

---

## Step 8: Test Office 365 Login

1. ไปที่: `http://localhost:5173/login`
2. คลิก: **"Sign in with Office 365"** (ปุ่มสีน้ำเงิน)
3. หน้าต่าง popup จะเปิด
4. เข้าสู่ระบบด้วย Microsoft 365 account
5. อนุญาต permissions
6. ✅ จะ redirect ไปหน้าแรก

---

## ✨ What You'll See When It Works

```
✅ Email from Office 365 displayed in UI
✅ Role set to "admin" automatically
✅ Data saved in localStorage
✅ Can access Settings page (admin only)
✅ Logout button works
```

---

## 🆘 Troubleshooting

### Error: "AADSTS700016: Application with identifier was not found"

**Check:**
- ✓ Client ID ถูกต้องในไฟล์ `.env`
- ✓ Server รีสตาร์ท แล้ว
- ✓ ไม่มี typo ใน Client ID

### Error: "AADSTS50020: User account does not exist"

**Fix:**
- ใช้ Microsoft 365 account จริง (ไม่ใช่ personal Microsoft account)
- หรือ ถ้าอยากใช้ personal account ต้องอนุญาต in Azure Portal

### Error: "Redirect URI mismatch"

**Check:**
- `VITE_REDIRECT_URI` ใน `.env` ตรงกับ Azure Portal
- ตัวอย่าง: ทั้งสองต้องเป็น `http://localhost:5173`

### Popup doesn't open

**Try:**
- ตรวจสอบ popup blocker ของ browser
- ใช้ incognito/private window
- รีสตาร์ท server

---

## 📚 Additional Resources

- **Detailed Setup:** See `OFFICE365_SETUP.md`
- **Architecture Details:** See `ARCHITECTURE.md`
- **Implementation Summary:** See `IMPLEMENTATION_SUMMARY.md`
- **Azure Portal:** https://portal.azure.com
- **MSAL Documentation:** https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview

---

## 🎯 Summary

```
What needs to happen:
━━━━━━━━━━━━━━━━━━━━

Azure Portal                           Your Project
──────────────────────                 ──────────────────
1. Register App          ──────────→  2. Copy Client ID
   ↓
3. Add Permissions       
   ↓
4. Get Client ID         ──────────→  5. Paste in .env
                                         ↓
                                      6. Restart server
                                         ↓
                                      7. Test login ✅
```

---

**Done! 🎉 Your Office 365 login is now ready to use!**
