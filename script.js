// ==========================================
// CONFIGURATION - Replace with your own IDs
// ==========================================
const TEMPLATE_ID = "YOUR_GOOGLE_SLIDES_TEMPLATE_ID";
const SLIDES_FOLDER_ID = "YOUR_GENERATED_SLIDES_FOLDER_ID";
const PDF_FOLDER_ID = "YOUR_GENERATED_PDFS_FOLDER_ID";
const VERIFICATION_SHEET_ID = "YOUR_VERIFICATION_SPREADSHEET_ID";
const WEB_APP_URL = "YOUR_DEPLOYED_APPS_SCRIPT_WEB_APP_URL";
const CERT_PREFIX = "THRIVE25-";

// Optional: Drive File IDs for logos displayed on the verification page
const LOGO_1_ID = "YOUR_LOGO_1_FILE_ID";
const LOGO_2_ID = "YOUR_LOGO_2_FILE_ID";
const LOGO_3_ID = "YOUR_LOGO_3_FILE_ID";

/**
 * Triggered automatically on Google Form submission.
 * Generates a personalized certificate with a QR code, saves as PDF,
 * logs details to Google Sheets, and emails the participant.
 */
function onFormSubmit(e) {
  const responses = e.namedValues;
  const name = responses["Name"][0];
  const email = responses["Email Address"][0]; // Requires "Collect email addresses" enabled in Form
  const certNo = generateCertificateNumber();

  // 1️⃣ Create Slides Copy from Template
  const slidesFolder = DriveApp.getFolderById(SLIDES_FOLDER_ID);
  const templateFile = DriveApp.getFileById(TEMPLATE_ID);
  const copy = templateFile.makeCopy(`${certNo}_${name}`, slidesFolder);

  const presentation = SlidesApp.openById(copy.getId());
  const slide = presentation.getSlides()[0];

  slide.replaceAllText("{{NAME}}", name);
  slide.replaceAllText("{{CERTIFICATE NUMBER}}", certNo);

  // 2️⃣ Generate Verification QR Code
  const verificationLink = `${WEB_APP_URL}?cert=${encodeURIComponent(certNo)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verificationLink)}`;
  const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob();

  slide.getShapes().forEach(shape => {
    if (shape.getText && shape.getText().asString().includes("{{QR}}")) {
      const left = shape.getLeft();
      const top = shape.getTop();
      const width = shape.getWidth();
      const height = shape.getHeight();

      shape.remove();

      slide.insertImage(qrBlob)
           .setLeft(left)
           .setTop(top)
           .setWidth(width)
           .setHeight(height);
    }
  });

  presentation.saveAndClose();

  // 3️⃣ Export Slide as PDF
  const pdfFolder = DriveApp.getFolderById(PDF_FOLDER_ID);
  const pdfBlob = copy.getAs("application/pdf");

  const pdfFile = pdfFolder.createFile(pdfBlob)
                           .setName(`${certNo}_${name}.pdf`);

  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 4️⃣ Log Certificate Record to Verification Sheet
  const verificationSS = SpreadsheetApp.openById(VERIFICATION_SHEET_ID);
  const sheet = verificationSS.getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Certificate No",
      "Name",
      "Generated On",
      "Status",
      "PDF File ID"
    ]);
  }

  sheet.appendRow([
    certNo,
    name,
    new Date(),
    "VALID",
    pdfFile.getId()
  ]);

  // 5️⃣ Email Certificate PDF to Participant
  MailApp.sendEmail({
    to: email,
    subject: "Your THRIVE’25 Certificate",
    htmlBody: `
      <p>Dear ${name},</p>
      <p>Your certificate for <strong>THRIVE’25 – Startup Conclave</strong> is attached.</p>
      <p>Certificate Number: <strong>${certNo}</strong></p>
      <p>You can verify it anytime using the QR code on the certificate.</p>
      <br>
      <p>Best Regards,<br>THRIVE’25 Team</p>
    `,
    attachments: [pdfFile.getBlob()]
  });
}

/**
 * Generates an auto-incrementing certificate ID (e.g., THRIVE25-001).
 */
function generateCertificateNumber() {
  const props = PropertiesService.getScriptProperties();
  let count = props.getProperty("CERT_COUNT");

  count = count ? parseInt(count, 10) + 1 : 1;
  props.setProperty("CERT_COUNT", count.toString());

  const formatted = Utilities.formatString("%03d", count);
  return CERT_PREFIX + formatted;
}

/**
 * Web App endpoint to verify a certificate via ?cert=<CERTIFICATE_NUMBER>
 */
function doGet(e) {
  const certNo = e.parameter.cert;

  if (!certNo) {
    return HtmlService.createHtmlOutput("Certificate number missing.");
  }

  const ss = SpreadsheetApp.openById(VERIFICATION_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === certNo) {
      const name = data[i][1];
      const generatedOn = data[i][2];
      const status = data[i][3];
      const fileId = data[i][4];

      const formattedDate = Utilities.formatDate(
        new Date(generatedOn),
        Session.getScriptTimeZone(),
        "dd MMM yyyy, hh:mm a"
      );

      const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const previewLink = `https://drive.google.com/file/d/${fileId}/preview`;

      return HtmlService.createHtmlOutput(`
      <html>
      <head>
        <title>Certificate Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #333;
            text-align: center;
          }
          .container {
            max-width: 900px;
            margin: 40px auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
          }
          .logo-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .logo-row img {
            height: 55px;
          }
          .checkmark {
            font-size: 60px;
            color: #28a745;
            animation: pop 0.6s ease forwards;
            opacity: 0;
          }
          @keyframes pop {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          h2 {
            margin-top: 10px;
            color: #28a745;
          }
          .info {
            margin: 10px 0;
            font-size: 18px;
          }
          .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: bold;
            background: #28a745;
            color: white;
            margin-top: 8px;
          }
          iframe {
            margin-top: 25px;
            width: 100%;
            height: 500px;
            border-radius: 10px;
            border: 1px solid #ddd;
          }
          .btn {
            margin-top: 20px;
            padding: 12px 30px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            transition: 0.3s;
          }
          .btn:hover {
            background: #0056b3;
          }
          .footer {
            margin-top: 20px;
            font-size: 13px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-row">
            <img src="https://drive.google.com/thumbnail?id=${LOGO_1_ID}&sz=w1000" alt="Logo 1">
            <img src="https://drive.google.com/thumbnail?id=${LOGO_2_ID}&sz=w1000" alt="Logo 2">
            <img src="https://drive.google.com/thumbnail?id=${LOGO_3_ID}&sz=w1000" alt="Logo 3">
          </div>

          <div class="checkmark">✔</div>
          <h2>Certificate Verified</h2>

          <div class="info"><strong>Certificate No:</strong> ${certNo}</div>
          <div class="info"><strong>Name:</strong> ${name}</div>
          <div class="info"><strong>Issued On:</strong> ${formattedDate}</div>
          <div class="badge">${status}</div>

          <iframe src="${previewLink}" allow="autoplay"></iframe>

          <a class="btn" href="${downloadLink}" target="_blank">
            Download Certificate
          </a>

          <div class="footer">
            THRIVE’25 – Startup Conclave<br>
            Pranveer Singh Institute of Technology
          </div>
        </div>
      </body>
      </html>
      `);
    }
  }

  return HtmlService.createHtmlOutput(`
    <html>
      <body style="margin:0; font-family:Segoe UI; background:#111; color:white; display:flex; justify-content:center; align-items:center; height:100vh;">
        <div style="text-align:center;">
          <h2 style="color:red;">Certificate Not Found</h2>
          <p>Please check the certificate number.</p>
        </div>
      </body>
    </html>
  `);
}