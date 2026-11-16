# Automated Event Certificate Generator & QR Verification System

An end-to-end certificate automation pipeline built with **Google Apps Script**. When a participant submits a Google Form, this script automatically generates a personalized certificate from a Google Slides template, embeds a unique QR verification code, exports it as a PDF, logs the record to Google Sheets, emails the PDF to the attendee, and hosts a live web portal to verify certificate authenticity.

---

## ✨ Features

- **Automated Certificate Generation:** Duplicates a master Google Slides template and dynamically populates participant details (`{{NAME}}`, `{{CERTIFICATE NUMBER}}`).
- **Sequential ID Tracking:** Uses `PropertiesService` to generate unique, zero-padded certificate numbers (e.g., `THRIVE25-001`, `THRIVE25-002`).
- **Dynamic QR Code Embedding:** Generates a QR code pointing to the verification endpoint and replaces the `{{QR}}` shape placeholder while preserving exact positioning and dimensions.
- **PDF Conversion & Cloud Archiving:** Exports the completed slide to PDF and organizes both editable Slides and final PDFs into dedicated Google Drive folders.
- **Automated Email Delivery:** Sends a formatted HTML email with the generated PDF certificate attached via `MailApp`.
- **Live Web Verification Portal (`doGet`):** Scanning the QR code opens a responsive verification page displaying the holder's name, issue timestamp, validity badge, embedded PDF preview, and a direct download button.

---

## 🛠️ Prerequisites & Google Workspace Setup

Before adding the code, set up the following resources in your Google Drive:

### 1. Google Drive Folders

Create two empty folders in Google Drive and copy their Folder IDs from the URL (`drive.google.com/drive/folders/<FOLDER_ID>`):

- **Generated Slides Folder** (`SLIDES_FOLDER_ID`)
- **Generated PDFs Folder** (`PDF_FOLDER_ID`)

### 2. Google Slides Certificate Template

Create a single-slide presentation (`TEMPLATE_ID`) with the following exact text placeholders:

- `{{NAME}}` — Text box where the participant's full name will appear.
- `{{CERTIFICATE NUMBER}}` — Text box where the unique ID will appear.
- `{{QR}}` — A shape (e.g., a square rectangle) sized and positioned where you want the QR code image to be inserted.

### 3. Verification Google Sheet

Create a blank Google Sheet (`VERIFICATION_SHEET_ID`) to act as your database. The script will automatically create the header row (`Certificate No | Name | Generated On | Status | PDF File ID`) on the first run.

### 4. Google Form

Create a Google Form with:

- **Collect email addresses** enabled in **Settings > Responses** (maps to `Email Address`).
- A short-answer question titled **`Name`** (exact match, case-sensitive).

---

## 🚀 Installation & Configuration

### Step 1: Attach the Script

1. Open your **Google Form** (or its linked response spreadsheet).
2. Click the three-dot menu (`⋮`) in the top-right corner and select **Apps Script** (or **Extensions > Apps Script** from Sheets).
3. Delete any default code in `Code.gs` and paste the contents of [`Code.gs`](./Code.gs).

### Step 2: Deploy the Verification Web App

To get the URL needed for the QR codes:

1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to _Select type_ and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy**, authorize the required permissions, and copy the generated **Web app URL** (`https://script.google.com/macros/s/.../exec`).

### Step 3: Update Configuration Constants

At the top of `Code.gs`, replace the placeholder values with your actual IDs and Web App URL:

```javascript
const TEMPLATE_ID = "YOUR_GOOGLE_SLIDES_TEMPLATE_ID";
const SLIDES_FOLDER_ID = "YOUR_GENERATED_SLIDES_FOLDER_ID";
const PDF_FOLDER_ID = "YOUR_GENERATED_PDFS_FOLDER_ID";
const VERIFICATION_SHEET_ID = "YOUR_VERIFICATION_SPREADSHEET_ID";
const WEB_APP_URL = "YOUR_DEPLOYED_APPS_SCRIPT_WEB_APP_URL";
const CERT_PREFIX = "THRIVE25-";
```

_(Optional)_ If you want organization logos displayed at the top of the verification page, upload them to Google Drive, set their sharing permissions to **Anyone with the link**, and paste their File IDs into `LOGO_1_ID`, `LOGO_2_ID`, and `LOGO_3_ID`.

### Step 4: Set Up the Form Submit Trigger

1. In the Apps Script left sidebar, click **Triggers** (the alarm clock icon).
2. Click **+ Add Trigger** in the bottom-right corner.
3. Configure the trigger with these settings:
   - **Choose which function to run:** `onFormSubmit`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From form`
   - **Select event type:** `On form submit`
4. Click **Save**.

---

## 🔍 How Verification Works

1. When a certificate is generated, the QR code encodes:
   ```text
   <WEB_APP_URL>?cert=THRIVE25-001
   ```
2. When someone scans the QR code, `doGet(e)` reads the `cert` query parameter and looks up the matching row in the Verification Sheet.
3. If found, it renders the verification badge, metadata, an embedded Google Drive PDF preview (`<iframe>`), and a direct download link. If invalid or missing, it displays a **Certificate Not Found** error screen.

---

## ⚠️ Notes & Quotas

- **Daily Email Limits:** Standard `@gmail.com` accounts have a daily quota of **100 recipients/day** via `MailApp`, while Google Workspace accounts allow up to **1,500 recipients/day**.
- **Resetting the Counter:** To reset or change the certificate sequence number, open **Project Settings > Script Properties** in the Apps Script editor and edit or delete the `CERT_COUNT` property.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
