# Institute API – Postman Testing Guide

**Base URL:** `http://localhost:3000` (change to your deployed URL if needed)

---

## Setup – Environment Variables in Postman

Create a Postman Environment with these variables:

| Variable | Example Value |
|---|---|
| `base_url` | `http://localhost:3000/api/v1` |
| `owner_token` | *(paste after login)* |
| `admin_token` | *(paste after login)* |
| `institute_id` | *(paste after creating institute)* |
| `course_id` | *(paste after creating course)* |
| `batch_id` | *(paste after creating batch)* |
| `fee_id` | *(paste after creating fee structure)* |
| `result_id` | *(paste after creating result)* |
| `city_id` | *(paste from cities response)* |
| `area_id` | *(paste from areas response)* |

---

## 1. Institute Owner Auth

### Login as Institute Owner
```
POST {{base_url}}/institute/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "yourpassword"
}
```
> Copy the token from response → save as `owner_token`

---

## 2. Admin Auth

### Login as Admin
```
POST {{base_url}}/admin/auth/login
Content-Type: application/json

{
  "email": "admin@vidyamarg.com",
  "password": "adminpassword"
}
```
> Copy the token from response → save as `admin_token`

---

---

# OWNER ROUTES
> **Header for all owner routes:**
> `Authorization: Bearer {{owner_token}}`
> **Prefix:** `/api/v1/owner/institutes`

---

## 3. Owner Dashboard

### Get My Dashboard Stats
```
GET {{base_url}}/owner/institutes/dashboard
Authorization: Bearer {{owner_token}}
```
**Expected Response:**
```json
{
  "data": {
    "totalInstitutes": 2,
    "approvedInstitutes": 1,
    "pendingInstitutes": 1,
    "totalCourses": 4,
    "totalBatches": 6,
    "totalFeeStructures": 4,
    "totalResults": 3
  }
}
```

---

## 4. Owner – Institutes

### Get My Institutes (only yours!)
```
GET {{base_url}}/owner/institutes
Authorization: Bearer {{owner_token}}
```
Optional query params: `?page=1&limit=10&sortBy=-createdAt`

---

### Create Institute
```
POST {{base_url}}/owner/institutes
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

name: "Sharma Coaching Centre"
establishedYear: 2015
directorName: "Ramesh Sharma"
about: "Top coaching for UPSC and SSC"
totalBranches: 3
avgFacultyExperience: 8
websiteUrl: https://sharmacoachinig.com
location: {"state":"Bihar","city":"{{city_id}}","area":"{{area_id}}","subarea":"SUBAREA_ID","fullAddress":"Near Gandhi Maidan, Patna","landmark":"Gandhi Maidan"}
facilities: {"smartClass":true,"wifiCampus":true,"library":true,"testSeries":true}
academicInfo: {"studentFacultyRatio":"30:1","teachingMethodology":"Offline + Recorded","remedialClasses":true}
transparency: {"admissionProcess":"Direct admission after test","feeClarity":"Full fee disclosed upfront"}
logo: [attach image file]
coverImage: [attach image file]
```
> Save the `_id` from response as `institute_id`

---

### Get My Specific Institute
```
GET {{base_url}}/owner/institutes/{{institute_id}}
Authorization: Bearer {{owner_token}}
```

---

### Update My Institute
```
PUT {{base_url}}/owner/institutes/{{institute_id}}
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

about: "Updated description"
totalBranches: 5
```

---

### Delete My Institute (cascades batches, courses, fees, results)
```
DELETE {{base_url}}/owner/institutes/{{institute_id}}
Authorization: Bearer {{owner_token}}
```

---

## 5. Owner – Courses

### Get My Courses
```
GET {{base_url}}/owner/institutes/courses
Authorization: Bearer {{owner_token}}
```
Optional: `?institute={{institute_id}}&page=1&limit=10`

---

### Create Course (linked to my institute)
```
POST {{base_url}}/owner/institutes/courses
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

name: "UPSC Foundation Batch"
description: "Complete preparation for UPSC Civil Services"
mode: "Hindi"
institute: {{institute_id}}
image: [attach image file – optional]
```
> **Important:** `institute` field must be one of YOUR institutes.
> Save `_id` as `course_id`

---

### Get Course By ID
```
GET {{base_url}}/owner/institutes/courses/{{course_id}}
Authorization: Bearer {{owner_token}}
```

---

### Update Course
```
PUT {{base_url}}/owner/institutes/courses/{{course_id}}
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

description: "Updated description for UPSC"
mode: "Hinglish"
```

---

### Delete Course
```
DELETE {{base_url}}/owner/institutes/courses/{{course_id}}
Authorization: Bearer {{owner_token}}
```

---

## 6. Owner – Batches

### Get My Batches
```
GET {{base_url}}/owner/institutes/batches
Authorization: Bearer {{owner_token}}
```
Optional: `?institute={{institute_id}}&page=1&limit=10`

---

### Create Batch
```
POST {{base_url}}/owner/institutes/batches
Authorization: Bearer {{owner_token}}
Content-Type: application/json

{
  "institute": "{{institute_id}}",
  "course": "{{course_id}}",
  "batchName": "UPSC 2026 Batch A",
  "startDate": "2026-04-01",
  "timing": "7:00 AM - 10:00 AM",
  "duration": "12 months",
  "studentsPerBatch": 40,
  "mode": "Offline",
  "totalSeats": 40
}
```
> Save `_id` as `batch_id`

---

### Get Batch By ID
```
GET {{base_url}}/owner/institutes/batches/{{batch_id}}
Authorization: Bearer {{owner_token}}
```

---

### Update Batch
```
PUT {{base_url}}/owner/institutes/batches/{{batch_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json

{
  "timing": "8:00 AM - 11:00 AM",
  "totalSeats": 50
}
```

---

### Delete Batch
```
DELETE {{base_url}}/owner/institutes/batches/{{batch_id}}
Authorization: Bearer {{owner_token}}
```

---

### Enroll Student in Batch
```
POST {{base_url}}/owner/institutes/batches/{{batch_id}}/enroll
Authorization: Bearer {{owner_token}}
```

---

## 7. Owner – Fee Structures

### Get My Fee Structures
```
GET {{base_url}}/owner/institutes/fee-structures
Authorization: Bearer {{owner_token}}
```
Optional: `?institute={{institute_id}}&page=1&limit=10`

---

### Create Fee Structure
```
POST {{base_url}}/owner/institutes/fee-structures
Authorization: Bearer {{owner_token}}
Content-Type: application/json

{
  "institute": "{{institute_id}}",
  "course": "{{course_id}}",
  "actualFee": 45000,
  "registrationAmount": 2000,
  "installmentAvailable": true,
  "installmentDetails": [
    { "amount": 20000, "dueDate": "2026-04-01" },
    { "amount": 25000, "dueDate": "2026-07-01" }
  ],
  "scholarshipAvailable": true,
  "scholarshipPercentage": 20,
  "scholarshipEligibility": "Students scoring above 80% in entrance test",
  "easyToFindOfferPrice": 40000,
  "refundPolicy": "50% refund within 15 days of admission"
}
```
> Save `_id` as `fee_id`

---

### Get Fee Structure By ID
```
GET {{base_url}}/owner/institutes/fee-structures/{{fee_id}}
Authorization: Bearer {{owner_token}}
```

---

### Update Fee Structure
```
PUT {{base_url}}/owner/institutes/fee-structures/{{fee_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json

{
  "actualFee": 50000,
  "scholarshipPercentage": 25
}
```

---

### Delete Fee Structure
```
DELETE {{base_url}}/owner/institutes/fee-structures/{{fee_id}}
Authorization: Bearer {{owner_token}}
```

---

## 8. Owner – Results

### Get My Results
```
GET {{base_url}}/owner/institutes/results
Authorization: Bearer {{owner_token}}
```
Optional: `?institute={{institute_id}}&page=1&limit=10`

---

### Create Result
```
POST {{base_url}}/owner/institutes/results
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

institute: {{institute_id}}
year: 2025
examType: UPSC Civil Services
totalStudentsQualified: 12
achievementSummary: "12 students cleared UPSC prelims, 3 in mains"
rankersListImage: [attach image file – optional]
certificatesImage: [attach image file – optional]
```
> Save `_id` as `result_id`

---

### Get Result By ID
```
GET {{base_url}}/owner/institutes/results/{{result_id}}
Authorization: Bearer {{owner_token}}
```

---

### Update Result
```
PUT {{base_url}}/owner/institutes/results/{{result_id}}
Authorization: Bearer {{owner_token}}
Content-Type: multipart/form-data

totalStudentsQualified: 15
achievementSummary: "Updated: 15 students cleared UPSC prelims"
```

---

### Delete Result
```
DELETE {{base_url}}/owner/institutes/results/{{result_id}}
Authorization: Bearer {{owner_token}}
```

---

---

# ADMIN ROUTES
> **Header for all admin routes:**
> `Authorization: Bearer {{admin_token}}`
> **Prefix:** `/api/v1/admin/institutes`

---

## 9. Admin – Stats

### Get Platform Institute Stats
```
GET {{base_url}}/admin/institutes/stats
Authorization: Bearer {{admin_token}}
```
**Expected Response:**
```json
{
  "data": {
    "total": 10,
    "approved": 7,
    "pending": 3,
    "active": 8,
    "totalCourses": 25,
    "totalBatches": 40
  }
}
```

---

## 10. Admin – Institutes (full control, no ownership restriction)

### Get All Institutes
```
GET {{base_url}}/admin/institutes
Authorization: Bearer {{admin_token}}
```
Optional filters: `?isApproved=false&isActive=true&page=1&limit=20`

---

### Get Institute By ID
```
GET {{base_url}}/admin/institutes/{{institute_id}}
Authorization: Bearer {{admin_token}}
```

---

### Create Institute (as Admin)
```
POST {{base_url}}/admin/institutes
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data

name: "Vidya Admin Test Institute"
establishedYear: 2020
directorName: "Admin User"
about: "Created by admin for testing"
location: {"state":"Bihar","city":"{{city_id}}","area":"{{area_id}}","subarea":"SUBAREA_ID","fullAddress":"MG Road, Patna"}
logo: [attach image – optional]
coverImage: [attach image – optional]
```

---

### Update Any Institute
```
PUT {{base_url}}/admin/institutes/{{institute_id}}
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data

about: "Admin updated this description"
totalBranches: 10
```

---

### Approve Institute
```
PATCH {{base_url}}/admin/institutes/{{institute_id}}/approve
Authorization: Bearer {{admin_token}}
```

---

### Reject Institute
```
PATCH {{base_url}}/admin/institutes/{{institute_id}}/reject
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "reason": "Incomplete documentation provided"
}
```

---

### Toggle Institute Active/Inactive
```
PATCH {{base_url}}/admin/institutes/{{institute_id}}/toggle-active
Authorization: Bearer {{admin_token}}
```

---

### Delete Institute (hard delete + cascade)
```
DELETE {{base_url}}/admin/institutes/{{institute_id}}
Authorization: Bearer {{admin_token}}
```

---

## 11. Admin – Courses

### Get All Courses (platform-wide)
```
GET {{base_url}}/admin/institutes/courses
Authorization: Bearer {{admin_token}}
```

### Create Course (Admin)
```
POST {{base_url}}/admin/institutes/courses
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data

name: "SSC CGL Preparation"
description: "Full syllabus coverage"
mode: "Hinglish"
institute: {{institute_id}}
image: [attach image – optional]
```

### Update Course (Admin)
```
PUT {{base_url}}/admin/institutes/courses/{{course_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "description": "Updated by admin"
}
```

### Delete Course (Admin)
```
DELETE {{base_url}}/admin/institutes/courses/{{course_id}}
Authorization: Bearer {{admin_token}}
```

---

## 12. Admin – Batches

### Get All Batches
```
GET {{base_url}}/admin/institutes/batches
Authorization: Bearer {{admin_token}}
```

### Create Batch (Admin)
```
POST {{base_url}}/admin/institutes/batches
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "institute": "{{institute_id}}",
  "course": "{{course_id}}",
  "batchName": "Admin Batch 2026",
  "startDate": "2026-05-01",
  "timing": "6:00 PM - 9:00 PM",
  "duration": "6 months",
  "mode": "Online",
  "totalSeats": 100
}
```

### Update Batch (Admin)
```
PUT {{base_url}}/admin/institutes/batches/{{batch_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "totalSeats": 150,
  "isActive": false
}
```

### Delete Batch (Admin)
```
DELETE {{base_url}}/admin/institutes/batches/{{batch_id}}
Authorization: Bearer {{admin_token}}
```

---

## 13. Admin – Fee Structures

### Get All Fee Structures
```
GET {{base_url}}/admin/institutes/fee-structures
Authorization: Bearer {{admin_token}}
```

### Create Fee Structure (Admin)
```
POST {{base_url}}/admin/institutes/fee-structures
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "institute": "{{institute_id}}",
  "course": "{{course_id}}",
  "actualFee": 30000,
  "registrationAmount": 1000,
  "installmentAvailable": false,
  "scholarshipAvailable": false,
  "refundPolicy": "No refund after 7 days"
}
```

### Update Fee Structure (Admin)
```
PUT {{base_url}}/admin/institutes/fee-structures/{{fee_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "actualFee": 35000
}
```

### Delete Fee Structure (Admin)
```
DELETE {{base_url}}/admin/institutes/fee-structures/{{fee_id}}
Authorization: Bearer {{admin_token}}
```

---

## 14. Admin – Results

### Get All Results
```
GET {{base_url}}/admin/institutes/results
Authorization: Bearer {{admin_token}}
```

### Create Result (Admin)
```
POST {{base_url}}/admin/institutes/results
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data

institute: {{institute_id}}
year: 2025
examType: SSC CGL
totalStudentsQualified: 25
achievementSummary: "25 students selected in SSC CGL 2025"
rankersListImage: [optional]
certificatesImage: [optional]
```

### Update Result (Admin)
```
PUT {{base_url}}/admin/institutes/results/{{result_id}}
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data

totalStudentsQualified: 30
achievementSummary: "Updated by admin"
```

### Delete Result (Admin)
```
DELETE {{base_url}}/admin/institutes/results/{{result_id}}
Authorization: Bearer {{admin_token}}
```

---

---

# PUBLIC ROUTES
> **No authentication required.**
> **Prefix:** `/api/v1/institutes`
> Only **approved + active** institutes are returned.

---

## 15. Location Lookups

### Get All Cities
```
GET {{base_url}}/institutes/cities
```

### Get Areas by City
```
GET {{base_url}}/institutes/areas/{{city_id}}
```

### Get Sub-Areas by Area
```
GET {{base_url}}/institutes/subareas/{{area_id}}
```

---

## 16. Institute Search & Detail

### Search Institutes
```
GET {{base_url}}/institutes
```
Supported query params:

| Param | Example | Description |
|---|---|---|
| `city` | `{{city_id}}` | Filter by city ObjectId |
| `area` | `{{area_id}}` | Filter by area ObjectId |
| `mode` | `Online` | Filter by batch mode |
| `scholarshipAvailable` | `true` | Filter by scholarship |
| `facilities` | `{"library":true,"wifiCampus":true}` | JSON encoded |
| `page` | `1` | Pagination |
| `limit` | `10` | Results per page |
| `sortBy` | `-createdAt` | Sort field |

**Example with filters:**
```
GET {{base_url}}/institutes?city={{city_id}}&page=1&limit=10
```

---

### Get Single Institute Detail
```
GET {{base_url}}/institutes/{{institute_id}}
```

---

## 17. Institute Sub-Resources (Public)

### Get Batches of an Institute
```
GET {{base_url}}/institutes/{{institute_id}}/batches
```
Optional: `?page=1&limit=10`

---

### Get Courses of an Institute
```
GET {{base_url}}/institutes/{{institute_id}}/courses
```

---

### Get Fee Structures of an Institute
```
GET {{base_url}}/institutes/{{institute_id}}/fee-structures
```

---

### Get Results of an Institute
```
GET {{base_url}}/institutes/{{institute_id}}/results
```

---

---

# Error Handling Reference

| Status | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Missing or invalid token |
| `403` | Authenticated but no permission (e.g., accessing another owner's institute) |
| `404` | Resource not found |
| `500` | Internal server error |

---

# Quick Test Flow (Recommended Order)

1. **Login** as Institute Owner → save `owner_token`
2. `GET /institutes/cities` → save a `city_id`
3. `GET /institutes/areas/{{city_id}}` → save an `area_id`
4. `GET /institutes/subareas/{{area_id}}` → save a `subarea_id`
5. `POST /owner/institutes` → create institute → save `institute_id`
6. `GET /owner/institutes/dashboard` → verify stats
7. `GET /owner/institutes` → should show **only your institutes**
8. `POST /owner/institutes/courses` → create course → save `course_id`
9. `POST /owner/institutes/batches` → create batch → save `batch_id`
10. `POST /owner/institutes/fee-structures` → create fee → save `fee_id`
11. `POST /owner/institutes/results` → create result → save `result_id`
12. **Login** as Admin → save `admin_token`
13. `GET /admin/institutes/stats` → see platform stats
14. `GET /admin/institutes` → see ALL institutes
15. `PATCH /admin/institutes/{{institute_id}}/approve` → approve it
16. `GET /institutes` → public search, should now show the approved institute
17. `GET /institutes/{{institute_id}}/batches` → public batches
