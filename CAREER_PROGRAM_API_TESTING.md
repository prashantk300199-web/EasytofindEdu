# Career Program API Postman Testing Guide

This document provides a detailed guide for testing all Career Program-related API endpoints using Postman. It covers both **Admin** and **Public** endpoints, including request methods, paths, parameters, authentication, and example payloads.

---

## Table of Contents
- [Public Endpoints](#public-endpoints)
  - [Get All Programs](#get-all-programs)
  - [Get Featured Programs](#get-featured-programs)
  - [Get Programs by Stream](#get-programs-by-stream)
  - [Get Related Programs](#get-related-programs)
  - [Get Program by Slug](#get-program-by-slug)
- [Admin Endpoints](#admin-endpoints)
  - [Programs CRUD](#programs-crud)
  - [Program-Exam Relationships](#program-exam-relationships)
  - [Program-College Relationships](#program-college-relationships)
  - [Bulk Operations](#bulk-operations)
  - [Entrance Exams CRUD](#entrance-exams-crud)
  - [Colleges CRUD](#colleges-crud)

---

## Public Endpoints

### 1. Get All Programs
- **GET** `/api/v1/careers/programs`
- **Query Params:**
  - `page` (number, optional)
  - `limit` (number, optional)
  - `tags` (string, comma-separated, optional)
  - `category` (string, optional)
  - `stream` (string, optional)
  - `sortBy` (string, optional)
- **Description:** Returns published programs with filters and pagination.
- **Example:**
  ```
  GET /api/v1/careers/programs?page=1&limit=12&tags=after_12th&stream=pcm
  ```

### 2. Get Featured Programs
- **GET** `/api/v1/careers/programs/featured?limit=6`
- **Description:** Returns featured programs.

### 3. Get Programs by Stream
- **GET** `/api/v1/careers/programs/stream/:stream`
- **Path Param:**
  - `stream` (string)
- **Description:** Returns programs for a specific stream.

### 4. Get Related Programs
- **GET** `/api/v1/careers/programs/:programId/related`
- **Path Param:**
  - `programId` (string)
- **Description:** Returns programs related to the given program.

### 5. Get Program by Slug
- **GET** `/api/v1/careers/programs/:slug`
- **Path Param:**
  - `slug` (string)
- **Description:** Returns program details by slug.

---

## Admin Endpoints
> **All admin endpoints require authentication.**

### Programs CRUD

#### 1. Get All Programs (Admin View)
- **GET** `/api/v1/admin/careers/programs?status=draft&page=1&limit=20`
- **Query Params:**
  - `status` (published | draft | archived | all)
  - `page`, `limit`

#### 2. Get Program Stats
- **GET** `/api/v1/admin/careers/programs/stats`

#### 3. Create Program
- **POST** `/api/v1/admin/careers/programs`
- **Body:**
  ```json
  {
    "title": "B.Tech Computer Science",
    "category": "engineering",
    ...
  }
  ```

#### 4. Update Program
- **PUT** `/api/v1/admin/careers/programs/:id`
- **Body:** (fields to update)

#### 5. Publish Program
- **PATCH** `/api/v1/admin/careers/programs/:id/publish`

#### 6. Archive Program
- **DELETE** `/api/v1/admin/careers/programs/:id`

### Program-Exam Relationships

#### 1. Add Exam to Program
- **POST** `/api/v1/admin/careers/programs/:programId/exams`
- **Body:**
  ```json
  {
    "examId": "..."
  }
  ```

#### 2. Remove Exam from Program
- **DELETE** `/api/v1/admin/careers/programs/:programId/exams/:examId`

### Program-College Relationships

#### 1. Add College to Program
- **POST** `/api/v1/admin/careers/programs/:programId/colleges`
- **Body:**
  ```json
  {
    "collegeId": "..."
  }
  ```

#### 2. Remove College from Program
- **DELETE** `/api/v1/admin/careers/programs/:programId/colleges/:collegeId`

### Bulk Operations

#### 1. Bulk Import Programs
- **POST** `/api/v1/admin/careers/programs/bulk/import`
- **Body:** (file upload or JSON array)

### Entrance Exams CRUD

#### 1. Get All Exams
- **GET** `/api/v1/admin/careers/exams?type=engineering&page=1&limit=20`

#### 2. Create Exam
- **POST** `/api/v1/admin/careers/exams`
- **Body:**
  ```json
  {
    "name": "JEE Main",
    ...
  }
  ```

#### 3. Update Exam
- **PUT** `/api/v1/admin/careers/exams/:id`
- **Body:** (fields to update)

#### 4. Publish Exam
- **PATCH** `/api/v1/admin/careers/exams/:id/publish`

#### 5. Archive Exam
- **DELETE** `/api/v1/admin/careers/exams/:id`

#### 6. Get Exam by Slug
- **GET** `/api/v1/admin/careers/exams/:slug`

### Colleges CRUD

#### 1. Get All Colleges
- **GET** `/api/v1/admin/careers/colleges?city=Mumbai&type=govt&page=1&limit=20`

#### 2. Get Top Colleges
- **GET** `/api/v1/admin/careers/colleges/top?limit=10`

#### 3. Create College
- **POST** `/api/v1/admin/careers/colleges`
- **Body:**
  ```json
  {
    "name": "IIT Bombay",
    ...
  }
  ```

#### 4. Update College
- **PUT** `/api/v1/admin/careers/colleges/:id`
- **Body:** (fields to update)

#### 5. Archive College
- **DELETE** `/api/v1/admin/careers/colleges/:id`

#### 6. Add Program to College
- **POST** `/api/v1/admin/careers/colleges/:collegeId/programs`
- **Body:**
  ```json
  {
    "programId": "..."
  }
  ```

#### 7. Get College by Slug
- **GET** `/api/v1/admin/careers/colleges/:slug`

---

## Postman Testing Tips
- Set the base URL (e.g., `http://localhost:3000` or your deployed server).
- For admin endpoints, include the authentication token in the `Authorization` header as `Bearer <token>`.
- Use the example bodies as templates for your requests.
- Check response status codes and messages for validation.

---

*This file covers all endpoints for Career Program APIs. For more details on request/response structure, refer to the controller and model files.*
