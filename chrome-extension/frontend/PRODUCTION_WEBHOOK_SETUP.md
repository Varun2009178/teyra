# 🚀 Production Webhook & Deployment Setup Guide

## 🌐 **Clerk Webhook Configuration (Production)**

### **1. Production Webhook Setup**
1. **Go to Clerk Dashboard** → Your Production Project
2. **Navigate to** Webhooks section
3. **Add New Webhook:**
   - **URL:** `https://teyra.app/api/webhooks/clerk`
   - **Events:** Select these events:
     - ✅ `user.created`
     - ✅ `user.updated` 
     - ✅ `user.deleted`
     - ✅ `session.created`
     - ✅ `session.ended`

### **2. Webhook Security**
- **Signing Secret:** Copy the webhook signing secret
- **Add to Environment:**
  ```bash
  CLERK_WEBHOOK_SECRET=whsec_your_secret_here
  ```

## ⏰ **Cron Job Verification (cron-job.org)**

### **1. Current Setup**
- **URL:** `https://teyra.app/api/cron/daily-emails`
- **Schedule:** Every 6 hours
- **Method:** POST
- **Headers:** 
  ```
  Authorization: Bearer YOUR_CRON_SECRET_KEY
  Content-Type: application/json
  ```

### **2. Test Cron Job**
- **Visit:** `https://cron-job.org`
- **Check:** Last execution time
- **Verify:** Response status (should be 200)
- **Monitor:** Error logs

### **3. Cron Job Health Check**
```bash
# Test endpoint manually
curl -X POST https://teyra.app/api/cron/daily-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY" \
  -H "Content-Type: application/json"
```

## 🔔 **Firebase Cloud Messaging Setup**

### **1. Production FCM Configuration**
1. **Firebase Console** → Your Project
2. **Project Settings** → Cloud Messaging
3. **Web Push certificates** → Generate new key pair
4. **Update Environment:**
   ```bash
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

### **2. FCM Token Management**
- **Automatic registration** when users enable notifications
- **Token storage** in `user_progress.fcm_token`
- **Background sync** for offline users

## 📱 **Mobile & PWA Optimization**

### **1. PWA Manifest**
- **File:** `public/manifest.json`
- **Features:**
  - App name: "Teyra"
  - Short name: "Teyra"
  - Theme color: "#000000"
  - Background color: "#ffffff"
  - Display: "standalone"

### **2. Service Worker**
- **File:** `public/sw.js`
- **Features:**
  - Offline caching
  - Push notification handling
  - Background sync

### **3. Mobile Meta Tags**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## 🎯 **Production Environment Variables**

### **1. Required Variables**
```bash
# Clerk (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Cron Job
CRON_SECRET_KEY=your_cron_secret_key

# AI Services (if using)
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
```

## 🧪 **Pre-Deployment Testing Checklist**

### **1. Core Functionality**
- [ ] **User Authentication**
  - [ ] Sign up/sign in works
  - [ ] Session persistence
  - [ ] User profile sync

- [ ] **Task Management**
  - [ ] Create tasks
  - [ ] Complete tasks
  - [ ] Delete tasks
  - [ ] Data persistence

- [ ] **Mood System**
  - [ ] Mood selection
  - [ ] Mood history
  - [ ] AI mood suggestions

### **2. Notifications**
- [ ] **Browser Notifications**
  - [ ] Permission requests
  - [ ] Test notifications
  - [ ] Click actions

- [ ] **Firebase Integration**
  - [ ] FCM token generation
  - [ ] Token storage
  - [ ] Background messaging

### **3. Mobile Experience**
- [ ] **Responsive Design**
  - [ ] Mobile layout
  - [ ] Touch interactions
  - [ ] PWA installation

- [ ] **Performance**
  - [ ] Page load times
  - [ ] Animation smoothness
  - [ ] Memory usage

## 🚀 **Deployment Steps**

### **1. Vercel Deployment**
1. **Push to main branch**
2. **Verify build success**
3. **Check environment variables**
4. **Test production URL**

### **2. Post-Deployment**
1. **Test all functionality**
2. **Verify webhooks work**
3. **Check cron job execution**
4. **Monitor error logs**

### **3. Production Monitoring**
- **Vercel Analytics** - Performance monitoring
- **Sentry** - Error tracking
- **Firebase Analytics** - User behavior
- **Clerk Dashboard** - User management

## 🔍 **Troubleshooting Common Issues**

### **1. Webhook Failures**
- **Check:** Clerk webhook logs
- **Verify:** Webhook URL accessibility
- **Test:** Manual webhook triggering

### **2. Cron Job Issues**
- **Check:** cron-job.org logs
- **Verify:** Endpoint accessibility
- **Test:** Manual API calls

### **3. Notification Problems**
- **Check:** Browser permissions
- **Verify:** FCM token generation
- **Test:** Firebase console

### **4. Mobile Issues**
- **Check:** Viewport meta tags
- **Verify:** PWA manifest
- **Test:** Service worker registration

## 📊 **Success Metrics**

### **1. Performance**
- **Page Load:** < 3 seconds
- **Time to Interactive:** < 5 seconds
- **Core Web Vitals:** All green

### **2. User Experience**
- **Notification Permission:** > 80% acceptance
- **PWA Installation:** > 60% of mobile users
- **Session Duration:** > 5 minutes average

### **3. Technical**
- **Webhook Success:** > 99%
- **Cron Job Success:** > 99%
- **Error Rate:** < 1%

---

**Goal: Deploy the most polished, mobile-friendly, notification-rich productivity app possible!** 🚀

## 🎯 **Next Steps After Setup**

1. **Test everything** on production domain
2. **Monitor performance** and error rates
3. **Gather user feedback** and iterate
4. **Scale and optimize** based on usage



