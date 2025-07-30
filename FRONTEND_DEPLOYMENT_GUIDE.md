# 🚀 NARAP Frontend Deployment Guide

Complete guide for deploying the NARAP frontend to various hosting platforms.

## 📋 Prerequisites

- ✅ Frontend files isolated in `frontend/` directory
- ✅ Backend deployed and accessible
- ✅ Domain name (optional but recommended)
- ✅ Git repository (for some platforms)

## 🎯 Quick Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Best for**: Modern static sites, automatic deployments, custom domains

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts**:
   - Link to existing project or create new
   - Set project name: `narap-frontend`
   - Confirm deployment

4. **Production deployment**
   ```bash
   vercel --prod
   ```

**✅ Advantages**:
- Automatic HTTPS
- Global CDN
- Custom domains
- Automatic deployments from Git
- Excellent performance

### Option 2: Netlify

**Best for**: Drag-and-drop deployment, form handling

1. **Go to [netlify.com](https://netlify.com)**
2. **Drag and drop** the `frontend` folder
3. **Or connect GitHub repository**
4. **Configure build settings**:
   - Build command: `echo "Static site"`
   - Publish directory: `.`

**✅ Advantages**:
- Simple drag-and-drop
- Form handling
- A/B testing
- Branch deployments

### Option 3: GitHub Pages

**Best for**: Free hosting, Git integration

1. **Push to GitHub repository**
2. **Go to repository Settings**
3. **Scroll to GitHub Pages section**
4. **Configure**:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /frontend

**✅ Advantages**:
- Free hosting
- Git integration
- Custom domains
- Automatic deployments

### Option 4: Traditional Web Hosting

**Best for**: Shared hosting, VPS, dedicated servers

1. **Upload files** via FTP/SFTP
2. **Set file permissions**:
   - Files: 644
   - Directories: 755
3. **Configure web server** (Apache/Nginx)

## 🔧 Configuration

### Backend URL Setup

The frontend is pre-configured to connect to:
- **Production**: `https://narap-backend.onrender.com`
- **Development**: `http://localhost:5000` (when on localhost)

### Custom Backend URL

If you need to change the backend URL:

```javascript
// Set in browser console
localStorage.setItem('narap_backend_url', 'https://your-backend.com');

// Or set globally
window.BACKEND_URL = 'https://your-backend.com';
```

### Environment Variables

For platforms that support environment variables:

```env
NODE_ENV=production
BACKEND_URL=https://narap-backend.onrender.com
```

## 🌐 Custom Domain Setup

### Vercel

1. **Add domain** in Vercel dashboard
2. **Update DNS records**:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### Netlify

1. **Add custom domain** in Netlify dashboard
2. **Update DNS records**:
   ```
   Type: CNAME
   Name: @
   Value: your-site.netlify.app
   ```

### GitHub Pages

1. **Add custom domain** in repository settings
2. **Create CNAME file** in repository root:
   ```
   yourdomain.com
   ```

## 🔒 Security Configuration

### CORS Setup

Ensure your backend CORS is configured for your frontend domain:

```javascript
// In backend/server.js
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

### HTTPS

All modern hosting platforms provide automatic HTTPS. Ensure:
- SSL certificate is active
- HTTP to HTTPS redirects are enabled
- Mixed content warnings are resolved

## 📱 Testing Checklist

After deployment, test:

### Main Portal (`/`)
- [ ] Page loads correctly
- [ ] Member verification works
- [ ] Certificate verification works
- [ ] Responsive design on mobile
- [ ] All images load properly

### Admin Panel (`/admin`)
- [ ] Login functionality
- [ ] Member management
- [ ] Certificate management
- [ ] Analytics dashboard
- [ ] Data export features

### General
- [ ] Backend connection working
- [ ] No console errors
- [ ] Fast loading times
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```
   Access to fetch at 'https://backend.com' from origin 'https://frontend.com' has been blocked by CORS policy
   ```
   **Solution**: Update backend CORS configuration

2. **404 Errors on Refresh**
   ```
   Cannot GET /admin
   ```
   **Solution**: Configure SPA routing in hosting platform

3. **Backend Connection Failed**
   ```
   Failed to fetch
   ```
   **Solution**: Check backend URL and network connectivity

4. **Images Not Loading**
   ```
   Failed to load resource
   ```
   **Solution**: Check file paths and permissions

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('narap_debug', 'true');
location.reload();
```

### Performance Issues

1. **Enable compression** in hosting platform
2. **Set cache headers** for static assets
3. **Optimize images** (already done)
4. **Use CDN** (automatic with most platforms)

## 📊 Monitoring

### Health Checks

Set up monitoring for:
- Frontend availability
- Backend connectivity
- Response times
- Error rates

### Analytics

Consider adding:
- Google Analytics
- Hotjar for user behavior
- Error tracking (Sentry)

## 🔄 Updates & Maintenance

### Frontend Updates

1. **Make changes** in frontend directory
2. **Test locally** with `npm start`
3. **Deploy changes**:
   ```bash
   # Vercel
   vercel --prod
   
   # Netlify
   # Automatic if connected to Git
   
   # GitHub Pages
   git push origin main
   ```

### Backend Updates

- Frontend automatically adapts to backend changes
- No frontend deployment required
- Monitor for API compatibility issues

## 📞 Support

### Platform Support

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Netlify**: [netlify.com/support](https://netlify.com/support)
- **GitHub**: [github.com/support](https://github.com/support)

### NARAP Support

For application-specific issues:
1. Check browser console for errors
2. Verify backend connectivity
3. Test with different browsers
4. Check deployment platform logs

## ✅ Final Checklist

Before going live:

- [ ] Frontend deployed successfully
- [ ] Backend deployed and accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CORS configured correctly
- [ ] All functionality tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

**🎉 Congratulations!** Your NARAP frontend is now deployed and ready for production use. 