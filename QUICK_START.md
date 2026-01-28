# Quick Setup Checklist - Office 365 Login

## ✅ สิ่งที่ทำเสร็จแล้ว (Code Implementation Complete)

- ✅ ติดตั้ง MSAL packages
- ✅ สร้าง msalConfig.ts
- ✅ อัปเดต useAuth hook ด้วย loginWithOffice365
- ✅ เพิ่มปุ่ม Office 365 Login ใน AuthModal
- ✅ ตั้ค่า MsalProvider ใน App.tsx
- ✅ สร้าง .env file

## 📋 ต้องทำต่อ (Next Steps)

### 1. สมัครสมาชิก Azure AD Application

**ไป:**
https://portal.azure.com

**ทำ:**
- ค้นหา "App registrations"
- คลิก "New registration"
- ตั้งชื่อ "Qollect"
- เลือก "Accounts in any organizational directory"
- ตั้ง Redirect URI: `http://localhost:5173`
- คลิก "Register"

### 2. คัดลอก Client ID

**ไป:**
App registrations > Qollect > Overview

**คัดลอก:**
Application (client) ID

### 3. เพิ่ม API Permissions

**ไป:**
App registrations > Qollect > API permissions

**เพิ่ม:**
- Add permission > Microsoft Graph > Delegated
- เลือก: email, profile, User.Read, openid

### 4. ตั้งค่า Environment Variables

**ไฟล์:**
`.env`

**เพิ่ม:**
```
VITE_AZURE_CLIENT_ID=<client-id-จาก-step-2>
VITE_REDIRECT_URI=http://localhost:5173
VITE_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

### 5. รีสตาร์ท Development Server

```bash
# หยุด server ปัจจุบัน (Ctrl+C)
# แล้วรัน:
npm run dev
```

### 6. ทดสอบ

ไป: `http://localhost:5173/login`

คลิก: "Sign in with Office 365"

ใช้: Microsoft 365 account ของคุณ

## 🎯 สิ่งที่จะเกิดขึ้นเมื่อล็อกอินเสร็จ

✅ Email จะแสดงใน UI  
✅ Role จะเป็น admin  
✅ ข้อมูลจะบันทึกใน localStorage  
✅ จะนำไปหน้าแรก (Home)  

## 📞 Help

ถ้าเกิดข้อผิดพลาด:
- ตรวจสอบ Client ID ใน .env
- รีสตาร์ท development server
- เช็ค API permissions ใน Azure Portal
- ดู OFFICE365_SETUP.md สำหรับรายละเอียดเพิ่มเติม
