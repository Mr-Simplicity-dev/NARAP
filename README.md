# NARAP Frontend 

Frontend application for the National Association of Refrigeration and Air Conditioning Professionals (NARAP) verification system.

## 🚀 Features

- **Member Verification Portal** - Verify NARAP members by code
- **Certificate Verification** - Verify certificates by number
- **Admin Panel** - Complete member and certificate management
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI/UX** - Clean, professional interface
- **Offline Support** - Works with local storage when offline

## 📁 Structure

```
frontend/
├── index.html          # Main verification portal
├── admin.html          # Admin panel
├── css/
│   └── admin.css       # Admin panel styles
├── js/
│   └── admin.js        # Admin panel functionality
├── images/             # Static images and logos
├── package.json        # Frontend dependencies
├── README.md           # This file
├── vercel.json         # Vercel deployment config
├── _redirects          # Netlify redirects
└── .gitignore          # Git ignore rules
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- Modern web browser
- Backend API server running

### Local Development

1. **Clone or navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies (optional)**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   # or
   npx serve . -p 3000
   ```

4. **Access the application**
   - Main Portal: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

### Backend Configuration

The frontend is configured to connect to:
- **Production Backend**: `https://narap-backend.onrender.com`
- **Development Backend**: `http://localhost:5000` (when running on localhost)

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure custom domain** (optional)
   - Connect your domain in Vercel dashboard
   - Update DNS settings

### Option 2: Netlify

1. **Drag and drop** the `frontend` folder to Netlify
2. **Or connect GitHub repository**
3. **Configure build settings**:
   - Build command: `echo "Static site"`
   - Publish directory: `.`

### Option 3: GitHub Pages

1. **Push to GitHub repository**
2. **Enable GitHub Pages** in repository settings
3. **Select source**: Deploy from a branch
4. **Select branch**: main
5. **Select folder**: /frontend

### Option 4: Traditional Web Hosting

1. **Upload all files** to your web server
2. **Ensure proper file permissions**
3. **Configure web server** for SPA routing

## 🔧 Configuration

### Backend URL Configuration

The frontend automatically detects the backend URL based on the environment:

```javascript
// For localhost development
if (currentOrigin.includes('localhost')) {
    return 'http://localhost:5000';
}

// For production
return 'https://narap-backend.onrender.com';
```

### Custom Backend URL

To use a custom backend URL:

```javascript
// Set in browser console
localStorage.setItem('narap_backend_url', 'https://your-custom-backend.com');

// Or set globally
window.BACKEND_URL = 'https://your-custom-backend.com';
```

## 📱 Pages & Features

### Main Portal (`index.html`)
- **Member Verification**: Verify NARAP members by code
- **Certificate Verification**: Verify certificates by number
- **Responsive Design**: Works on all devices
- **Professional UI**: Clean, modern interface

### Admin Panel (`admin.html`)
- **Member Management**: Add, edit, delete members
- **Certificate Management**: Issue, revoke certificates
- **Analytics Dashboard**: View statistics and reports
- **Data Export**: Export data in CSV/JSON format
- **System Management**: Backup, restore, sync data

## 🔒 Security Features

- **CORS Protection**: Backend validates frontend origin
- **JWT Authentication**: Secure admin access
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based requests

## 📊 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for your frontend domain
   - Check that `FRONTEND_URL` is set correctly in backend

2. **Backend Connection Issues**
   - Verify backend is running and accessible
   - Check network connectivity
   - Test backend health endpoint

3. **Admin Panel Not Loading**
   - Clear browser cache
   - Check JavaScript console for errors
   - Verify all files are uploaded correctly

4. **Mobile Responsiveness Issues**
   - Test on different screen sizes
   - Check CSS media queries
   - Verify viewport meta tag

### Debug Mode

Enable debug logging in browser console:

```javascript
// Enable debug mode
localStorage.setItem('narap_debug', 'true');

// Check backend connection
testBackendConnection();
```

## 📞 Support

For frontend-specific issues:
1. Check browser console for errors
2. Verify all files are present and accessible
3. Test backend connectivity
4. Check deployment platform logs

## ✅ Deployment Checklist

- [ ] All files copied to frontend directory
- [ ] Backend URL configured correctly
- [ ] CORS settings updated on backend
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate installed
- [ ] Testing completed on all pages
- [ ] Mobile responsiveness verified
- [ ] Admin panel functionality tested
- [ ] Error handling verified

## 🔄 Updates & Maintenance

### Updating Frontend
1. **Modify files** in frontend directory
2. **Test locally** with `npm start`
3. **Deploy changes** to hosting platform
4. **Verify functionality** on live site

### Backend Updates
- Frontend automatically adapts to backend API changes
- No frontend deployment required for backend updates
- Monitor for API compatibility issues

---

**NARAP Frontend** - Professional verification system for refrigeration and air conditioning professionals. 
verified