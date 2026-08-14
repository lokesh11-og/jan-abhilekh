# 🇮🇳 Jan Abhilekh

### Digital Government Records. Smarter Verification. Faster Citizen Services.

**Jan Abhilekh** is an officer-focused digital document management platform designed to move government records from physical paperwork to searchable, verifiable digital records.

It combines document scanning, OCR, structured data extraction, citizen records, intelligent search, document verification workflows, and bilingual support in a single platform.

---

## 🚀 Live Demo

### **[Open Jan Abhilekh →](https://jan-abhilekh-production.up.railway.app/app/)**

> **No installation required for the live demo.**
> Open the link and explore the application directly.

### 💻 Source Code

**[View the GitHub Repository →](https://github.com/lokesh11-og/jan-abhilekh)**

---

## 🎯 The Problem

Government offices still handle a large amount of information through physical documents.

This creates common problems:

* Searching through records takes time
* Documents can be difficult to verify
* Duplicate records can go unnoticed
* Poor scans affect OCR and data entry
* Officers have to manually track corrections and pending work
* Important citizen information remains scattered across documents

Jan Abhilekh is designed to address these problems through a centralized digital workflow.

---

## 💡 What Jan Abhilekh Does

The platform connects the complete document journey:

**Physical Document → Scan → OCR → Data Extraction → Officer Verification → Secure Record → Search → Citizen Service**

Instead of simply storing scanned PDFs, the system turns document content into structured information that can be searched and used in administrative workflows.

---

## ✨ Key Features

### 📄 Live Document Scanning

Capture a physical government document using a phone and transfer it to the system for processing.

### 🔎 Real OCR

Uses **Tesseract OCR** to process the actual scanned document and extract text from it.

### 🧾 Automatic Field Extraction

Extracts useful `Label: Value` information from the OCR output instead of relying on hardcoded document values.

### 👤 Citizen Records

Documents are associated with citizen records so officers can access relevant information from one place.

### 🔍 Intelligent Search

Search across saved records and find citizens or documents using information contained in the actual records.

### ⚠️ Document Error Detection

Highlights issues such as:

* Missing signatures
* OCR failures
* Incorrect document types
* Duplicate records
* Information mismatches

### 👨‍💼 Officer Workflows

Dashboard actions allow officers to review, verify, resolve and prepare records instead of treating the dashboard as a static interface.

### 🌐 English + Marathi

The portal supports switching between:

**EN | मराठी**

### 📊 Persistent Records

Processed documents and extracted information are stored in the backend so they can be accessed again instead of disappearing after a session.

---

# 🔄 How the Live Scan Works

```text
Select Citizen
      ↓
Create Scan Session
      ↓
Generate QR / Link
      ↓
Open on Phone
      ↓
Capture Physical Document
      ↓
Upload Image
      ↓
Tesseract OCR
      ↓
Extract Fields
      ↓
Save Document + Data
      ↓
Search the New Record
```

The processing stages shown in the interface are connected to the backend workflow rather than being a simple presentation animation.

---

# 🧪 Suggested Demo Flow

For the best experience, start with the **Officer Dashboard**.

### 1. Dashboard

Explore the pending actions, document errors and flagged records.

### 2. Citizen Search

Search for an existing citizen and open their record.

Example:

```text
Sunita Deshmukh
```

### 3. Scan Document

Open **Scan Document** and select a citizen.

The workflow can create a scan session and generate a QR/link for document capture.

### 4. Scan from Phone

Open the generated link on a phone, capture the physical document and submit it.

### 5. OCR & Extraction

The server processes the actual image using Tesseract OCR and extracts available fields.

### 6. Verify

Review the extracted information before it becomes part of the citizen's document record.

### 7. Search

Use the search functionality to find information from the newly processed record.

---

# 🏗️ System Architecture

```text
                 JAN ABHILEKH
                      │
        ┌─────────────┴─────────────┐
        │                           │
   Officer Portal              Mobile Capture
        │                           │
        └─────────────┬─────────────┘
                      ↓
                 Node.js Server
                      │
             ┌────────┴────────┐
             ↓                 ↓
        Tesseract OCR      Data Processing
             │                 │
             └────────┬────────┘
                      ↓
                Digital Records
                      │
             ┌────────┴────────┐
             ↓                 ↓
        Smart Search      Officer Workflows
             │                 │
             └────────┬────────┘
                      ↓
                Citizen Services
```

---

# 🛠️ Technology Stack

| Layer           | Technology            |
| --------------- | --------------------- |
| Frontend        | HTML, CSS, JavaScript |
| Backend         | Node.js               |
| Server          | Express               |
| OCR             | Tesseract OCR         |
| Database        | Supabase / PostgreSQL |
| Data Processing | JavaScript            |
| Deployment      | Railway               |
| Source Control  | GitHub                |

---

# 📁 Project Structure

```text
jan-abhilekh/
│
├── frontend/          # Main officer portal
├── public/            # Public/static pages
├── db/                # Database and schema
├── scripts/            # Setup and utility scripts
├── tessdata/           # OCR language data
├── server.js           # Backend server
├── package.json        # Project configuration
├── package-lock.json
├── .env.example        # Environment variable template
└── README.md
```

---

# 🔐 Security & Configuration

Environment variables and API credentials are **not stored in the public repository**.

The project uses environment variables for services that require credentials.

For local development, use:

```text
.env
```

based on:

```text
.env.example
```

The deployed application receives its required configuration through the hosting environment.

---

# 🖥️ Local Development

The live demo above requires **no local installation**.

For developers who want to run the project locally:

```bash
npm install
```

If OCR language data needs to be prepared:

```bash
npm run setup
```

Then start the server:

```bash
npm start
```

Open:

```text
http://localhost:4000/app/
```

For mobile document capture during local development, the phone and laptop should be connected to the same network.

---

# 📌 Current Scope

The current version focuses on the core government-record workflow:

* Document capture
* OCR
* Field extraction
* Citizen association
* Persistent document records
* Search
* Officer verification workflows
* Error and duplicate review
* English / Marathi interface

The architecture is designed so additional government workflows and schemes can be added without changing the core document pipeline.

---

# 🌱 Future Scope

Possible extensions include:

* AI-based scheme eligibility matching
* Advanced document anomaly detection
* Aadhaar-assisted citizen matching
* Automated department workflows
* Digital signatures
* Role-based access control
* Audit trails
* Multi-department record sharing
* Advanced analytics for government officers
* More Indian regional languages

---

# 👥 Team

**Jan Abhilekh — Hackathon Project**

Built with the goal of making government records easier to **digitize, verify, find and act upon.**

---

## 🚀 Try It

**[Open the Live Jan Abhilekh Portal →](https://jan-abhilekh-production.up.railway.app/app/)**

**[View Source Code on GitHub →](https://github.com/lokesh11-og/jan-abhilekh)**

> Built for faster, smarter and more accessible public record management.

