# Authentication Flow Testing Guide

**Backend:** https://costpie-backend.onrender.com  
**Frontend:** http://localhost:8080  
**Supabase:** https://cnpgynayzzatfsxlveur.supabase.co  

## 🔐 **Authentication Test Checklist**

### **Step 1: Start Development Environment**
```bash
cd /Users/rupesh.panwar/Documents/pp/costpie/frontend
npm run dev
# Frontend will be available at http://localhost:8080
```

### **Step 2: Test Unauthenticated Access**
- [ ] Open http://localhost:8080 in browser
- [ ] Should redirect to login page or show login form
- [ ] Verify protected routes are not accessible without authentication
- [ ] Check console for any JavaScript errors

### **Step 3: Test User Registration**
- [ ] Navigate to sign-up page
- [ ] Enter email and password
- [ ] Click "Sign Up"
- [ ] Check for email verification (if enabled)
- [ ] Verify successful registration

### **Step 4: Test User Login**
- [ ] Navigate to login page
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] Should redirect to dashboard/main app
- [ ] Verify user session is established

### **Step 5: Verify JWT Token Handling**
**Using Browser Dev Tools:**
1. [ ] Open browser Developer Tools (F12)
2. [ ] Go to Network tab
3. [ ] Login to the application
4. [ ] Make an API call (view organizations, etc.)
5. [ ] Check request headers for:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. [ ] Verify token is automatically attached to API calls

### **Step 6: Test Protected API Endpoints**
**After successful login, test these endpoints in Network tab:**
- [ ] `GET /organizations/mine` - Should return user's organizations
- [ ] `POST /organizations` - Should create new organization
- [ ] `GET /organizations/{id}/cloud-accounts` - Should list cloud accounts
- [ ] All requests should include `Authorization: Bearer [token]` header

### **Step 7: Test Session Management**
- [ ] Refresh the page - user should remain logged in
- [ ] Close and reopen browser - check if session persists
- [ ] Test logout functionality
- [ ] After logout, verify protected routes are inaccessible

### **Step 8: Test Token Refresh**
- [ ] Leave application open for extended period
- [ ] Make API calls after token near expiry
- [ ] Verify automatic token refresh (if implemented)
- [ ] Check for seamless user experience

## 🧪 **Manual Testing Scenarios**

### **Scenario A: Happy Path**
1. User opens app → redirected to login
2. User signs up with valid email
3. User verifies email (if required)
4. User logs in successfully
5. User accesses dashboard
6. User creates organization
7. User adds cloud account
8. All API calls include proper authentication headers

### **Scenario B: Authentication Errors**
1. User enters invalid credentials → proper error message
2. User tries to access protected route → redirected to login
3. Token expires → user is logged out or token refreshes
4. Network error during auth → proper error handling

### **Scenario C: Session Persistence**
1. User logs in successfully
2. User refreshes page → remains logged in
3. User closes browser tab
4. User reopens application → check session state

## 🔧 **Technical Verification**

### **Check API Client Integration**
**In browser console, test the API client:**
```javascript
// After logging in, test API calls
fetch('/api/organizations/mine', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('supabase.auth.token')
  }
})
.then(response => response.json())
.then(data => console.log('Organizations:', data));
```

### **Verify Supabase Configuration**
**Check in browser console:**
```javascript
// Verify Supabase client
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY);

// Check current session
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Current session:', data.session);
  console.log('User:', data.session?.user);
  console.log('Access token:', data.session?.access_token);
});
```

## ✅ **Success Criteria**

### **Minimum Requirements:**
- [ ] User can successfully register and login
- [ ] JWT tokens are properly sent with API requests
- [ ] Protected routes work correctly
- [ ] Basic error handling is functional

### **Production Ready:**
- [ ] Session persistence works across browser sessions
- [ ] Token refresh handles expired tokens
- [ ] All error scenarios handled gracefully
- [ ] No JavaScript console errors
- [ ] Logout clears session completely

## 🚨 **Common Issues & Solutions**

### **Issue: CORS Errors**
**Solution:** Backend CORS is configured for `http://localhost:8080`
```
Access-Control-Allow-Origin: *
```

### **Issue: JWT Token Not Sent**
**Check:**
- Supabase auth hook is properly configured
- API client includes auth headers
- Token is stored in session/localStorage

### **Issue: 401 Unauthorized**
**Check:**
- Token is valid and not expired
- Backend JWT verification is working
- Supabase configuration matches

### **Issue: Infinite Redirect Loops**
**Check:**
- Protected route logic
- Auth state detection
- Default route configuration

## 📝 **Testing Results Template**

### **Test Results:**
- [ ] ✅ Authentication UI works
- [ ] ✅ User registration successful
- [ ] ✅ User login successful
- [ ] ✅ JWT tokens sent with API requests
- [ ] ✅ Protected routes work
- [ ] ✅ Session persistence works
- [ ] ✅ Logout functionality works
- [ ] ✅ Error handling works

### **Issues Found:**
1. [Description of issue]
   - **Impact:** [High/Medium/Low]
   - **Solution:** [Steps to fix]

2. [Description of issue]
   - **Impact:** [High/Medium/Low]
   - **Solution:** [Steps to fix]

---

**Next Steps After Authentication Testing:**
1. Test core functionality (organizations, cloud accounts)
2. Test AWS integration workflows
3. Test error handling scenarios
4. Prepare for production deployment