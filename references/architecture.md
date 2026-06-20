````markdown
# architecture.md

# Vapt Market — System Architecture Document

## 1. Project Overview

### Project Name
Vapt Market

### Description
Vapt Market is a modern web platform focused on short video advertisements for businesses, products, services, and local promotions.

The platform combines:
- TikTok/Reels experience
- Marketplace functionality
- Fast local advertising
- Direct WhatsApp communication
- Geolocation-based discovery

Main concept:
> “Anuncie em vídeo. Venda mais rápido.”

---

# 2. Main Objective

Allow administrators to publish short promotional video ads using:
- YouTube video links
- Promotional content
- Product showcases
- Business advertisements

The platform focuses on:
- Quick engagement
- Easy navigation
- Mobile-first experience
- Video-driven sales

---

# 3. Core Features

## 3.1 Video Feed System

### Features
- Vertical video feed
- Infinite scrolling
- Auto-play videos
- Mobile optimized
- Like system
- Favorite system
- Share system

### Advertisement Card Structure
Each advertisement must contain:

| Field | Description |
|---|---|
| title | Advertisement title |
| companyName | Business name |
| youtubeUrl | YouTube video link |
| thumbnail | Video cover image |
| description | Short description |
| category | Advertisement category |
| city | Business city |
| whatsappLink | WhatsApp contact |
| websiteLink | Optional website |
| location | Google Maps link |
| price | Product/service price |
| installmentInfo | Installment text |
| featured | Featured advertisement |
| createdAt | Publication date |
| expiresAt | Expiration date |

---

# 4. Categories System

## Supported Categories

- Restaurants
- Inns
- Hotels
- Vehicles
- Real Estate
- Fashion
- Electronics
- Services
- Markets
- Construction
- Tourism
- Promotions
- Events
- Delivery
- Used Products

---

# 5. User Roles

## 5.1 Administrator
Main platform manager.

Permissions:
- Create advertisements
- Edit advertisements
- Delete advertisements
- Manage users
- Manage categories
- Create banners
- Highlight ads
- Access analytics
- Control monetization

---

## 5.2 Users
Regular visitors.

Permissions:
- Browse feed
- Search advertisements
- Favorite advertisements
- Like advertisements
- Share advertisements
- Contact advertisers
- Request advertisement publication

---

# 6. Authentication

## Login Providers
- Google Authentication

## Authentication Technology
- Firebase Authentication

---

# 7. Frontend Architecture

## Stack
- React
- Next.js
- Tailwind CSS

## Frontend Structure

```txt
/src
  /app
  /components
  /pages
  /layouts
  /services
  /hooks
  /context
  /styles
  /utils
```

---

# 8. Backend Architecture

## Backend Stack
- Node.js
- Firebase

## Services

### Firebase Authentication
Handles:
- Login
- Session management
- User authentication

### Firebase Firestore
Handles:
- Advertisements
- Users
- Categories
- Favorites
- Analytics

### Firebase Storage
Handles:
- Images
- Thumbnails
- Banner uploads

---

# 9. Database Structure

## Collection: users

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "photoURL": "string",
  "role": "admin | user",
  "createdAt": "timestamp"
}
```

---

## Collection: advertisements

```json
{
  "id": "string",
  "title": "string",
  "companyName": "string",
  "youtubeUrl": "string",
  "thumbnail": "string",
  "description": "string",
  "category": "string",
  "city": "string",
  "price": "number",
  "installmentInfo": "string",
  "whatsappLink": "string",
  "websiteLink": "string",
  "location": "string",
  "featured": true,
  "likes": 0,
  "favorites": 0,
  "createdAt": "timestamp",
  "expiresAt": "timestamp"
}
```

---

## Collection: categories

```json
{
  "id": "string",
  "name": "string",
  "icon": "string"
}
```

---

# 10. Main Pages

## 10.1 Home Page

### Components
- Video feed
- Search bar
- Categories
- Featured ads
- Navigation menu

---

## 10.2 Advertisement Page

### Components
- Embedded YouTube video
- Product information
- WhatsApp button
- Share button
- Location button

---

## 10.3 Company Page

### Components
- Company profile
- Published videos
- Contact information
- Social media links

---

## 10.4 User Dashboard

### Features
- Edit profile
- Favorites
- Request advertisement publication

---

## 10.5 Admin Dashboard

### Features
- Advertisement management
- User management
- Statistics
- Banner management
- Featured ads control

---

# 11. Search System

## Search Filters
- Category
- City
- Region
- Company name
- Product name
- Promotions

---

# 12. Chat & Communication

## Communication Options
- WhatsApp direct redirect
- Internal chat system (optional enable/disable)
- “Tenho Interesse” button

---

# 13. Geolocation System

## Features
- Detect nearby advertisements
- Regional filtering
- Local recommendations

## APIs
- Google Maps API
- Browser Geolocation API

---

# 14. Monetization

## Free Plan
- 1 advertisement
- 15-second video
- Standard visibility

---

## Premium Plan
- Featured advertisements
- More videos
- Extended duration
- Analytics dashboard
- Verified profile

---

## Sponsored Advertisements
Businesses can pay for:
- Feed priority
- Featured positions
- Homepage banners

---

# 15. Responsive Design

## Devices Supported
- Smartphones
- Tablets
- Desktop

## Mobile-First Strategy
The platform must prioritize mobile usability.

---

# 16. UI/UX Design

## Inspiration
- TikTok
- Instagram Reels
- Mercado Livre
- OLX

## Color Palette
- Vibrant Blue
- Orange
- White
- Black

---

# 17. Security

## Security Requirements
- Firebase authentication protection
- Admin route protection
- Secure API calls
- Input validation
- Rate limiting
- HTTPS only

---

# 18. SEO Strategy

## SEO Requirements
- Dynamic metadata
- Open Graph support
- Structured data
- Friendly URLs
- Server-side rendering with Next.js

---

# 19. Performance Optimization

## Performance Strategies
- Lazy loading
- Infinite scroll optimization
- CDN delivery
- Video thumbnail optimization
- Image compression
- Caching strategies

---

# 20. MVP Scope

## Initial Release Features

### Must Have
- User registration
- Google login
- Video advertisements
- Feed system
- Categories
- Search system
- WhatsApp integration
- Admin panel
- Mobile responsiveness

---

# 21. Future Features

## Planned Features
- AI-generated advertisement descriptions
- Coupons system
- Seller ratings
- Push notifications
- Analytics dashboard
- Progressive Web App (PWA)

---

# 22. Suggested Deployment

## Frontend Hosting
- Vercel

## Backend Hosting
- Firebase

## CDN
- Cloudflare

---

# 23. Recommended Folder Architecture

```txt
root/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── layouts/
│   └── styles/
│
├── backend/
│   ├── firebase/
│   ├── functions/
│   ├── services/
│   └── middleware/
│
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   └── api.md
│
└── README.md
```

---

# 24. Final Vision

Vapt Market aims to become a fast, visual, and intuitive local advertising platform where:
- Businesses gain visibility through video
- Customers discover products instantly
- Communication happens directly through WhatsApp
- Local sales become faster and more engaging

Core philosophy:
> “Show it. Sell it. Deliver it.”

````
