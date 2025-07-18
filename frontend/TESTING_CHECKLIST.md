# 🧪 Teyra App Testing Checklist

## 🚀 Quick Start Testing
1. **Start dev server**: `npm run dev`
2. **Open browser**: `http://localhost:3000`
3. **Open DevTools**: F12 to see console logs

## 🔍 New User Flow Testing

### 1. Account Creation
- [ ] **Sign up with new email**
- [ ] **Check console for errors** (should see no "cannot load data" errors)
- [ ] **Verify onboarding modal appears**
- [ ] **Check no daily reset popup appears**

### 2. First Session
- [ ] **Add first task** (should work smoothly)
- [ ] **Complete first task** (should trigger celebration)
- [ ] **Check mood check-in** (should work once per day for free users)
- [ ] **Test AI features** (if Pro user)

### 3. Data Persistence
- [ ] **Refresh page** (tasks should remain)
- [ ] **Close browser, reopen** (data should persist)
- [ ] **Check user stats** (should be created properly)

## 🔄 Existing User Flow Testing

### 1. Return User
- [ ] **Sign in with existing account**
- [ ] **Check daily reset logic** (should only trigger if 24h+ since last reset)
- [ ] **Verify task progress popup** (only for users with completed tasks)

### 2. Daily Reset Testing
- [ ] **Manually trigger daily reset** (if needed for testing)
- [ ] **Check email notifications** (should work properly)
- [ ] **Verify limits reset** (mood check-ins, AI splits)

## 🐛 Common Issues to Check

### Console Errors
- [ ] **No "cannot load data" spam**
- [ ] **No database connection errors**
- [ ] **No authentication errors**
- [ ] **No React hydration errors**

### UI Issues
- [ ] **No unwanted popups for new users**
- [ ] **All modals work properly**
- [ ] **Animations don't break**
- [ ] **Responsive design works**

### Data Issues
- [ ] **Tasks save properly**
- [ ] **User stats update correctly**
- [ ] **No duplicate data**
- [ ] **No missing data**

## 🔧 Debug Commands

### Check Database
```bash
# Test database connection
npm run test:db-connection

# Check user data
npm run check:users

# Check email data
npm run check:emails
```

### Test Specific Features
```bash
# Test cron jobs
npm run test:cron

# Test email system
npm run test:email

# Test daily reset
npm run test:timer
```

## 📊 Analytics Testing
- [ ] **Check Vercel Analytics** (should load without errors)
- [ ] **Verify page views tracked**
- [ ] **Check console for analytics logs**

## 🚨 Emergency Fixes

### If New User Flow Breaks
1. Check `isNewUser` state in dashboard
2. Verify user stats creation order
3. Check daily reset logic

### If Data Loading Fails
1. Check Supabase connection
2. Verify environment variables
3. Check authentication state

### If UI Breaks
1. Check for React hydration errors
2. Verify all components are client-side
3. Check for missing dependencies

## 📝 Bug Reporting Template

When you find a bug, note:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Console errors**
5. **Browser/device info**
6. **User type** (new vs existing)

## 🎯 Priority Testing Order

1. **New user signup** (most critical)
2. **Basic task management**
3. **Data persistence**
4. **Daily reset logic**
5. **Email notifications**
6. **AI features**
7. **Analytics tracking**

---

**Remember**: Test on both desktop and mobile, and try different browsers if possible! 