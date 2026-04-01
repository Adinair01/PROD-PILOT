# Frontend Setup

## Run the frontend:
```bash
cd frontend
npm run dev
```

## Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Complete User Flow:
1. Go to http://localhost:5173
2. Click "Create Organization" to signup
3. Fill in: Name, Email, Password, Organization Name
4. After signup, you'll be redirected to login
5. Login with your credentials
6. You'll see the PM Dashboard with:
   - Health Score
   - Risk Level
   - Most Impacted Role
   - Top Priority Issues
   - Sentiment Distribution (Pie Chart)
   - Submit Feedback Form

## Pages:
- `/` - Login page
- `/signup` - Create organization (admin signup)
- `/dashboard` - PM Dashboard with insights and charts
