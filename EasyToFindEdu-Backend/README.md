# EasyToFindEdu API

Hostel listing and management platform API built with Node.js, Express, MongoDB, JWT, Cloudinary, and Gmail SMTP.

## Features

- **Owner Auth** — Register with OTP email verification, Login with JWT
- **Owner Dashboard** — Full profile management with photo upload
- **Hostel Management** — Complete CRUD with photos, amenities, rooms, rules, nearby places, meal plans
- **Masked Names** — Public users see masked hostel names
- **Admin Panel** — SuperAdmin seeds via script, creates admin members
- **Hostel Approval** — Admin approves/rejects hostel listings
- **Booking System** — Full lifecycle: pending → confirmed → checked_in → checked_out
- **Reviews & Ratings** — Auto-calculated rating summaries
- **Advanced Search** — Text search, geo-spatial queries, filters, sorting
- **Analytics** — Views and leads tracking per hostel
- **Cloudinary** — Image uploads for profiles and hostels

## Setup

```bash
git clone <repo-url>
cd vidya-marg-api
npm install
cp .env.example .env    # Fill in your credentials
npm run seed            # Seed superadmin
npm run dev             # Start development server
```

## API Endpoints

### Owner Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register owner |
| POST | `/api/v1/auth/verify-otp` | Verify email OTP |
| POST | `/api/v1/auth/login` | Owner login |
| POST | `/api/v1/auth/resend-otp` | Resend OTP |
| POST | `/api/v1/auth/logout` | Logout |

### Owner Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/owner/profile` | Get profile |
| PUT | `/api/v1/owner/profile` | Update profile |
| PUT | `/api/v1/owner/profile/photo` | Upload photo |
| DELETE | `/api/v1/owner/profile/photo` | Delete photo |

### Hostel Management (Owner)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hostels` | Create hostel |
| GET | `/api/v1/hostels` | Get my hostels |
| GET | `/api/v1/hostels/:id` | Get hostel by ID |
| PUT | `/api/v1/hostels/:id` | Update hostel |
| DELETE | `/api/v1/hostels/:id` | Delete hostel |
| PATCH | `/api/v1/hostels/:id/toggle` | Open/Close hostel |
| GET | `/api/v1/hostels/:id/analytics` | Get analytics |
| DELETE | `/api/v1/hostels/:id/photos/:photoId` | Delete photo |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings/hostels/:hostelId/book` | Create booking |
| GET | `/api/v1/bookings` | Get owner bookings |
| GET | `/api/v1/bookings/:id` | Get booking by ID |
| PATCH | `/api/v1/bookings/:id/status` | Update status |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reviews/hostels/:hostelId/reviews` | Create review |
| GET | `/api/v1/reviews/hostels/:hostelId/reviews` | Get reviews |

### Admin Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/auth/login` | Admin login |
| POST | `/api/v1/admin/auth/logout` | Admin logout |
| GET | `/api/v1/admin/auth/profile` | Admin profile |

### Admin — Manage Members (SuperAdmin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/members` | Create admin |
| GET | `/api/v1/admin/members` | List admins |
| GET | `/api/v1/admin/members/:id` | Get admin |
| PUT | `/api/v1/admin/members/:id` | Update admin |
| DELETE | `/api/v1/admin/members/:id` | Delete admin |

### Admin — Manage Owners
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/owners` | List owners |
| GET | `/api/v1/admin/owners/:id` | Get owner details |
| PATCH | `/api/v1/admin/owners/:id/status` | Update owner status |
| DELETE | `/api/v1/admin/owners/:id` | Delete owner |

### Admin — Manage Hostels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/hostels/dashboard` | Dashboard stats |
| GET | `/api/v1/admin/hostels` | List all hostels |
| GET | `/api/v1/admin/hostels/:id` | Get hostel details |
| PATCH | `/api/v1/admin/hostels/:id/status` | Approve/Reject |
| PATCH | `/api/v1/admin/hostels/:id/priority` | Set sort priority |
| DELETE | `/api/v1/admin/hostels/:id` | Delete hostel |
| GET | `/api/v1/admin/hostels/:id/bookings` | Hostel bookings |
| GET | `/api/v1/admin/hostels/:id/reviews` | Hostel reviews |
| PATCH | `/api/v1/admin/hostels/reviews/:reviewId/toggle` | Toggle review |

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public/hostels` | Search hostels |
| GET | `/api/v1/public/hostels/nearby` | Nearby hostels |
| GET | `/api/v1/public/hostels/cities` | Available cities |
| GET | `/api/v1/public/hostels/:slug` | Hostel by slug |
| GET | `/api/v1/public/amenities` | Amenities list |
| GET | `/api/v1/public/rules` | Rules list |

## Search Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Text search |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `hostel_type` | string | boys / girls / both |
| `min_price` | number | Minimum monthly rent |
| `max_price` | number | Maximum monthly rent |
| `room_type` | string | single / double / triple / dorm |
| `amenities` | string | Comma-separated amenity keys |
| `min_rating` | number | Minimum overall rating |
| `lat` | number | Latitude for nearby |
| `lng` | number | Longitude for nearby |
| `radius_km` | number | Radius in kilometers |
| `sort_by` | string | price_asc / price_desc / rating / newest / views |
| `page` | number | Page number |
| `limit` | number | Results per page |

## Deploy on Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set environment variables in Render dashboard
5. Deploy

## Tech Stack

Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer (Gmail SMTP), Cloudinary, Multer, Joi, Slugify# Backend redeployment trigger - Sun Sep  6 00:19:51 IST 2026
