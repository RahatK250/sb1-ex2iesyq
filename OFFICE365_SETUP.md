# Office 365 / Azure AD Authentication Setup Guide

## ขั้นตอนการตั้งค่า Office 365 Login

ข้อผิดพลาดที่เกิดขึ้นเป็นเพราะระบบยังไม่มี Client ID ของ Azure AD application ให้ทำตามขั้นตอนด้านล่าง:

### Step 1: สมัครสมาชิก Azure AD Application

1. ไปที่ [Azure Portal](https://portal.azure.com)
2. ค้นหา "App registrations" และคลิก
3. คลิก "New registration"
4. กรอกข้อมูล:
   - **Name**: Qollect (หรือชื่อแอปพลิเคชันของคุณ)
   - **Supported account types**: Accounts in any organizational directory (Any Azure AD directory - Multitenant)
   - **Redirect URI**: Web - `http://localhost:5173`

5. คลิก "Register"

### Step 2: คัดลอก Client ID

1. หลังจากสมัครสมาชิกสำเร็จ ให้ดู "Application (client) ID" ในหน้า Overview
2. คัดลอก Client ID นี้

### Step 3: เพิ่ม API Permissions

1. ไปที่ "API permissions" ในเมนูด้านซ้าย
2. คลิก "Add a permission"
3. เลือก "Microsoft Graph"
4. เลือก "Delegated permissions"
5. ค้นหาและเลือก:
   - `email`
   - `profile`
   - `User.Read`
   - `openid`

6. คลิก "Add permissions"

### Step 4: ตั้งค่าสภาพแวดล้อม (Environment Variables)

1. เปิดไฟล์ `.env` ในโปรเจค (สร้างหากไม่มี)
2. เพิ่มสิ่งต่อไปนี้:

```env
# Supabase Configuration (ตามที่มีอยู่)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key

# Azure AD / Office 365 Configuration
VITE_AZURE_CLIENT_ID=your-client-id-from-step-2
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

### Step 5: เปลี่ยนสภาพแวดล้อมสำหรับ Production

เมื่ออัปโหลดไปยัง Production (เช่น Vercel, Netlify ฯลฯ):

1. เข้าไป Azure Portal > App registrations > Qollect
2. ไปที่ "Authentication" 
3. เพิ่ม Redirect URI ใหม่:
   - `https://yourdomain.com`
   - `https://yourdomain.com/` (ลบท้าย hash router if needed)

4. ในที่ตั้งค่า environment ของคุณ (Vercel/Netlify) ให้เพิ่ม:
   ```
   VITE_AZURE_CLIENT_ID=your-client-id
   VITE_REDIRECT_URI=https://yourdomain.com
   VITE_LOGOUT_REDIRECT_URI=https://yourdomain.com/login
   ```

### Step 6: ทดสอบการทำงาน

1. เรียกใช้เซิร์ฟเวอร์พัฒนา:
   ```bash
   npm run dev
   ```

2. ไปที่ http://localhost:5173/login
3. คลิก "Sign in with Office 365"
4. ใช้ Microsoft 365 account ของคุณเพื่อล็อกอิน

## ตัวอักษรอ้างอิง

### msalConfig.ts
ไฟล์การกำหนดค่า MSAL ตั้งอยู่ใน `src/config/msalConfig.ts`

### useAuth.tsx
Hook สำหรับการยืนยันตัวตนที่สนับสนุน:
- Traditional email/password login
- Office 365 login (ด้วย `loginWithOffice365`)

### AuthModal.tsx
ส่วนประกอบการเข้าสู่ระบบที่มี:
- Email/Password form (เดิม)
- Office 365 login button (ใหม่)

## ข้อมูลเพิ่มเติม

- ผู้ใช้ทั้งหมดที่ล็อกอินด้วย Office 365 จะได้รับบทบาท **admin** โดยอัตโนมัติ
- อีเมลจะถูกเก็บไว้ใน localStorage
- การยืนยันตัวตนถูกจัดการโดย MSAL (Microsoft Authentication Library)

## แก้ไขปัญหา

### Error: AADSTS700016 - Application with identifier was not found
- ตรวจสอบให้แน่ใจว่า `VITE_AZURE_CLIENT_ID` ถูกตั้งค่าอย่างถูกต้องในไฟล์ `.env`
- เริ่มต้นเซิร์ฟเวอร์พัฒนาใหม่หลังจากแก้ไขค่า `.env`

### Error: AADSTS50020 - User account does not exist
- ใช้บัญชี Microsoft 365 ที่เป็นส่วนหนึ่งขององค์กรของคุณ
- หรือลดระดับคำขอให้สำหรับบัญชีส่วนบุคคล (Microsoft accounts)

### Redirect URI mismatch
- ตรวจสอบให้แน่ใจว่า Redirect URI ใน Azure Portal ตรงกับ `VITE_REDIRECT_URI` ใน `.env`
