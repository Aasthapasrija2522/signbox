# SignBox

A simplified e-signature platform that lets users upload a PDF, create a secure signing link, collect a signature, and generate a completed signed PDF.

SignBox was built as a learning project to understand how a full-stack application works end-to-end, including authentication, database relationships, file handling, API authorization, and server-side PDF processing.



## Problem Statement

Signing a document digitally involves more than just drawing a signature. The application needs to securely store the original document, control who can access it, allow another person to sign without creating an account, and finally generate a new PDF containing the signature.

SignBox implements this workflow by allowing a document owner to upload a PDF and create a token-based signing link. The signer can open that link, view the document, draw a signature, and submit it. The backend then stamps the signature onto the original PDF and creates the completed signed document.



## Features

* User signup and login
* Password hashing using bcrypt
* JWT-based authentication for document owners
* Protected document APIs
* Document ownership checks
* PDF upload with file-type validation
* User-specific file naming
* Document dashboard
* Document status tracking
* Token-based signing links
* Signer access without requiring an account
* Canvas-based signature capture
* Mouse and touch signature support
* Server-side PDF signature stamping
* Separate storage for original and signed PDFs
* Download completed signed documents



## Tech Stack

| Layer             | Technology        | Why                                                         |
| ----------------- | ----------------- | ----------------------------------------------------------- |
| Frontend          | React + Vite      | Component-based UI and fast development                     |
| Styling           | Tailwind CSS      | Utility-based styling                                       |
| Backend           | FastAPI           | Type hints, request validation, automatic API documentation |
| Database          | PostgreSQL        | Relational data storage                                     |
| ORM               | SQLAlchemy        | Database models and queries                                 |
| Authentication    | JWT               | Stateless authentication for document owners                |
| Password Security | bcrypt            | Secure password hashing                                     |
| PDF Processing    | pypdf + ReportLab | Create signature overlays and merge them with PDFs          |
| File Storage      | Local filesystem  | Simple storage suitable for an MVP                          |



## Architecture

text
                         ┌──────────────────────┐
                         │      React + Vite     │
                         │       Frontend        │
                         └───────────┬──────────┘
                                     │
                              HTTP / REST API
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │       FastAPI        │
                         │        Backend       │
                         └───────┬──────┬───────┘
                                 │      │
                     ┌───────────┘      └──────────────┐
                     ▼                                 ▼
             ┌─────────────────┐             ┌──────────────────┐
             │    PostgreSQL   │             │   File Storage   │
             │                 │             │                  │
             │ users           │             │ uploads/         │
             │ documents       │             │ signed/          │
             │ signing_requests│             │                  │
             │ signatures      │             └──────────────────┘
             └─────────────────┘


OWNER AUTHENTICATION

React
  │
  │ Authorization: Bearer <JWT>
  ▼
FastAPI
  │
  ▼
PostgreSQL


SIGNER AUTHENTICATION

Signing Link
  │
  │ /sign/{random-token}
  ▼
FastAPI
  │
  ▼
Signing Request


### Authentication Model

The application has two separate access flows.

Document owner

The owner creates an account and logs in. The backend returns a JWT which is sent with protected API requests using the `Authorization` header.

Signer

The signer does not need an account. Instead, the document owner creates a signing request and the backend generates a random token. The signer accesses the document through:

text
/sign/{token}


The token identifies the signing request.



## Database Schema

The main database relationships are:

```text
users
  │
  │ 1 : N
  ▼
documents
  │
  │ 1 : N
  ▼
signing_requests
  │
  │ 1 : N
  ▼
signatures


### Tables

#### Users

Stores registered application users.

text
id
email
hashed_password
```

#### Documents

Stores uploaded document metadata.

```text
id
title
file_path
signed_file_path
status
owner_id → users.id
```

#### Signing Requests

Stores information about a signing request.

```text
id
document_id → documents.id
signer_email
token
status
```

#### Signatures

Stores the submitted signature associated with a signing request.

```text
id
signing_request_id → signing_requests.id
image_data
```

The PDFs themselves are not stored directly inside PostgreSQL. PostgreSQL stores their metadata and file paths, while the actual files are stored on disk.

---

## Document Status Flow

```text
Draft
  │
  ▼
Pending
  │
  ▼
Viewed
  │
  ▼
Signed
```

When a document is uploaded, it starts as a document owned by the user.

When the owner creates a signing request:

```text
Document → Pending
```

When the signer opens the signing link:

```text
Signing Request → Viewed
```

When the signer submits the signature:

```text
Signing Request → Signed
Document → Signed
```

---

## Signing Flow

```text
1. Owner logs in
       ↓
2. Owner uploads PDF
       ↓
3. Original PDF saved in uploads/
       ↓
4. Owner creates signing request
       ↓
5. Backend generates signing token
       ↓
6. Signing link is returned
       ↓
7. Signer opens the link
       ↓
8. Signer views the document
       ↓
9. Signer draws signature
       ↓
10. Signature image is sent to FastAPI
       ↓
11. Backend creates PDF signature overlay
       ↓
12. Overlay is merged with original PDF
       ↓
13. Signed PDF saved in signed/
       ↓
14. Document status becomes Signed
       ↓
15. Owner downloads signed PDF
```

The signature is not simply stored as an image. The backend uses **ReportLab** to generate a PDF overlay containing the signature and **pypdf** to merge that overlay with the original document.

---

## API Documentation

| Method | Path                              | Authentication | Description                         |
| ------ | --------------------------------- | -------------- | ----------------------------------- |
| POST   | `/auth/register`                  | None           | Create a new user                   |
| POST   | `/auth/login`                     | None           | Authenticate and return JWT         |
| GET    | `/auth/me`                        | JWT            | Get current user information        |
| GET    | `/documents`                      | JWT            | List the logged-in user's documents |
| POST   | `/documents/upload`               | JWT            | Upload a PDF                        |
| POST   | `/documents`                      | JWT            | Create document metadata            |
| GET    | `/documents/{id}`                 | JWT            | Get document metadata               |
| GET    | `/documents/{id}/file`            | JWT            | Get original PDF                    |
| POST   | `/documents/{id}/signing-request` | JWT            | Create a signing request            |
| GET    | `/sign/{token}`                   | Signing token  | Get signing information             |
| GET    | `/sign/{token}/file`              | Signing token  | Get PDF for signing                 |
| POST   | `/sign/{token}`                   | Signing token  | Submit signature                    |
| GET    | `/documents/{id}/signed-file`     | JWT            | Download signed PDF                 |

### Authorization

The owner-only document endpoints verify both:

```text
Authenticated user ID
        +
Document owner ID
```

For example, the original PDF endpoint queries the document using:

```python
models.Document.id == document_id,
models.Document.owner_id == current_user.id
```

This prevents one authenticated user from accessing another user's document simply by changing the document ID.

---

## PDF Processing

The signing backend currently uses a fixed signature position:

```text
Page: 1
X: 50
Y: 50
```

The flow is:

```text
Original PDF
     +
Signature Image
     ↓
ReportLab Overlay
     ↓
pypdf Merge
     ↓
Signed PDF
```

The generated signed document is saved separately from the original document.

---

## File Storage

The application currently uses local filesystem storage.

```text
backend/
│
├── uploads/
│   └── original PDFs
│
└── signed/
    └── signed PDFs
```

This keeps the original document and completed signed document separate.

For production deployment, object storage such as Amazon S3 would be more appropriate.

---

## Installation & Running Locally

### Prerequisites

Install:

* Python 3.10+
* Node.js
* PostgreSQL
* Git

---

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>
cd signbox
```

---

### 2. Create PostgreSQL Database

Open PostgreSQL:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE signbox_db;
```

---

### 3. Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

### 4. Environment Variables

Create:

```text
backend/.env
```

Add:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/signbox_db
JWT_SECRET=<your-own-random-secret>
```

Do **not** commit `.env` to GitHub.

A `.gitignore` should include at least:

```text
.env
venv/
__pycache__/
*.pyc
uploads/
signed/
```

---

### 5. Start Backend

From the `backend` directory:

```bash
uvicorn main:app --reload
```

FastAPI will start the development server.

---

### 6. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite.

---

## Environment Variables

| Variable       | Purpose                           |
| -------------- | --------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string      |
| `JWT_SECRET`   | Secret used to create/verify JWTs |

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/signbox_db
JWT_SECRET=replace-with-a-random-secret
```

Never commit real passwords, JWT secrets, API keys, or other credentials.

---

## Known Limitations

### 1. Fixed Signature Position

The current MVP places the signature at a predefined position on the first page.

There is no drag-and-drop signature positioning yet.

### 2. Single-Signer Workflow

The current implementation supports a simple signing request flow rather than multiple or sequential signers.

### 3. Signing Links Do Not Expire

Signing tokens are generated and stored, but the current implementation does not contain an `expires_at` field or expiration check.

Therefore, signing links currently do not automatically expire.

Token expiration and revocation can be added in a future version.

### 4. No Real Email Delivery

The backend generates the signing link, but the application does not currently send the link through an email service.

The link is displayed/returned to the application instead.

### 5. Local File Storage

PDF files are stored on the local filesystem.

This is suitable for a learning/MVP project but is not ideal for a production environment with multiple backend servers.

A future version could use Amazon S3 or another object-storage service.

### 6. No Database Migration System

The project currently uses:

```python
Base.metadata.create_all(bind=engine)
```

instead of a migration tool such as Alembic.

For a larger application, database migrations would make schema changes safer and easier to manage.

### 7. No Automated Test Suite

The application has been tested manually through the frontend and API flow.

Automated unit and integration tests have not yet been added.

### 8. JWT in URL Query Parameter

The current authentication dependency supports JWTs through both the normal `Authorization` header and a `token` query parameter.

This was useful for browser-based download access, but passing authentication tokens through URLs is not ideal for production because URLs can appear in browser history, logs, or other systems.

A production implementation should use a safer download mechanism.

### 9. Limited Audit Trail

The MVP does not currently provide a complete audit history of signing events such as timestamps, IP addresses, or every document-access event.

---

## Future Improvements

* Drag-and-drop signature positioning
* Multiple signers
* Sequential signing workflow
* Signing-token expiration
* Signing-token revocation
* Email delivery using an email provider
* Cloud/object storage for PDFs
* Alembic database migrations
* Automated unit and integration tests
* Detailed audit logs
* Better PDF page/position selection
* Rate limiting
* Stronger production security controls
* Production deployment architecture

---

## Lessons Learned

The biggest thing I learned from SignBox was that building a full-stack application is not just about making the frontend and backend work separately. I had to understand how authentication, authorization, database relationships, file storage and API communication fit together.

One of the most useful parts was implementing the actual signing flow. Capturing a signature on a React canvas was only the first step. I then had to send that signature to the backend, generate a PDF overlay, merge it with the original PDF, and save the resulting signed document.

I also learned the difference between authentication and authorization. A JWT can tell the backend who the user is, but that does not automatically mean the user should have access to every document. The backend still needs to check document ownership.

Another important lesson was debugging across the full stack. A problem that appears in the frontend can actually come from the API, database, file path, authentication logic, or CORS configuration.

If I had another 20 days, I would focus more on making the application production-ready rather than only adding features. I would add automated tests, database migrations, expiring signing tokens, cloud file storage, stronger authorization controls, and a proper audit trail.

Overall, SignBox helped me understand the complete flow of a full-stack application:

```text
Frontend
   ↓
API
   ↓
Authentication
   ↓
Authorization
   ↓
Database
   ↓
File Processing
   ↓
Final User Output
```

---

## Project Structure

```text
signbox/
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── auth.py
│   ├── pdf_utils.py
│   ├── requirements.txt
│   ├── .env
│   ├── uploads/
│   └── signed/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Project Status

**Status:** MVP / Learning Project

The core document signing flow is implemented:

```text
Register/Login
      ↓
Upload PDF
      ↓
Create Signing Request
      ↓
Generate Signing Link
      ↓
Signer Opens Link
      ↓
Capture Signature
      ↓
Generate Signed PDF
      ↓
Download Signed PDF

