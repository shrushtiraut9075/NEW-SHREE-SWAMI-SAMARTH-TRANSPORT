const sharp = require('sharp');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generatePhonePeStandee() {
  const upiPayload = 'upi://pay?pa=shreeswamisamarth@ybl&pn=NEW%20SHREE%20SWAMI%20SAMARTH%20TRANSPORT&cu=INR&tn=Transport%20Charges';

  // Generate QR code SVG with high error correction ('Q' = 25% recovery)
  const qrSvgString = await QRCode.toString(upiPayload, {
    type: 'svg',
    errorCorrectionLevel: 'Q',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  // Extract the inner SVG elements from qrSvgString
  const innerQr = qrSvgString
    .replace(/<\?xml.*?\?>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');

  // Full PhonePe Standee SVG matching "QR SSST.jpeg"
  // Dimensions: 500px width x 880px height (high definition)
  const standeeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 880" width="500" height="880" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- White Background with soft rounded corner border -->
  <rect width="500" height="880" fill="#ffffff" />
  
  <!-- 1. TOP HEADER: PhonePe Logo & Text -->
  <g transform="translate(145, 60)">
    <!-- Purple circle with white Devanagari 'पे' -->
    <circle cx="28" cy="28" r="26" fill="#5f259f" />
    <text x="28" y="37" fill="#ffffff" font-size="28" font-weight="bold" text-anchor="middle" font-family="'Mukta', 'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif">पे</text>
    
    <!-- "PhonePe" Brand Name -->
    <text x="68" y="38" fill="#1e2432" font-size="34" font-weight="900" letter-spacing="-0.5px">PhonePe</text>
  </g>

  <!-- 2. "ACCEPTED HERE" in vibrant bold purple -->
  <text x="250" y="150" fill="#5f259f" font-size="20" font-weight="900" letter-spacing="1.5px" text-anchor="middle">ACCEPTED HERE</text>

  <!-- 3. "Scan & Pay Using PhonePe App" -->
  <text x="250" y="195" fill="#1e293b" font-size="18" font-weight="700" text-anchor="middle">Scan &amp; Pay Using PhonePe App</text>

  <!-- 4. CENTER QR CODE CONTAINER (Crisp, High Contrast & Perfectly Centered) -->
  <g transform="translate(60, 240)">
    <rect width="380" height="380" fill="#ffffff" rx="12" stroke="#e2e8f0" stroke-width="2" />
    <!-- Crisp, 100% scannable unblocked QR code -->
    <g transform="translate(10, 10)">
      <svg width="360" height="360" viewBox="0 0 45 45">
        ${innerQr}
      </svg>
    </g>
  </g>

  <!-- 5. "SHREE SWAMI SAMARTH TRANSPORT" in prominent bold black -->
  <text x="250" y="680" fill="#090d16" font-size="19" font-weight="900" letter-spacing="0.8px" text-anchor="middle">SHREE SWAMI SAMARTH TRANSPORT</text>

  <!-- UPI ID badge -->
  <g transform="translate(130, 705)">
    <rect width="240" height="28" rx="14" fill="#f3e8ff" stroke="#d8b4fe" stroke-width="1" />
    <text x="120" y="19" fill="#6b21a8" font-size="13" font-weight="bold" font-family="monospace" text-anchor="middle">UPI: shreeswamisamarth@ybl</text>
  </g>

  <!-- 6. COPYRIGHT & ENTITY DETAILS -->
  <text x="250" y="785" fill="#374151" font-size="13" font-weight="700" text-anchor="middle">© 2026, All rights reserved, PhonePe Ltd</text>
  <text x="250" y="810" fill="#6b7280" font-size="12" font-weight="600" text-anchor="middle">(Formerly known as &apos;PhonePe Private Ltd&apos;)</text>
</svg>
`;

  // Render to high-resolution JPEG and PNG
  const svgBuffer = Buffer.from(standeeSvg);

  const outJpg = path.join(process.cwd(), 'public', 'phonepe_qr.jpg');
  const outPng = path.join(process.cwd(), 'public', 'phonepe_qr.png');
  const outDistJpg = path.join(process.cwd(), 'dist', 'phonepe_qr.jpg');

  await sharp(svgBuffer)
    .jpeg({ quality: 98 })
    .toFile(outJpg);

  await sharp(svgBuffer)
    .png({ compressionLevel: 8 })
    .toFile(outPng);

  if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
    await sharp(svgBuffer)
      .jpeg({ quality: 98 })
      .toFile(outDistJpg);
  }

  // Also create a standalone pure QR PNG for instant vector embedding in PDFs
  const pureQrBuffer = await QRCode.toBuffer(upiPayload, {
    errorCorrectionLevel: 'H',
    width: 600,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  fs.writeFileSync(path.join(process.cwd(), 'public', 'phonepe_qr_code.png'), pureQrBuffer);

  console.log('Successfully generated high-resolution PhonePe Standee and pure QR code!');
}

generatePhonePeStandee().catch(err => {
  console.error('Error generating PhonePe QR standee:', err);
  process.exit(1);
});
