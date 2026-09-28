import QRCode from 'qrcode';

export interface UpiQrOptions {
  upiId?: string;
  payeeName?: string;
  amount?: number;
  transactionNote?: string;
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Standard UPI URI generator adhering strictly to NPCI specifications.
 * Scannable by PhonePe, Google Pay, Paytm, BHIM, and all bank UPI apps.
 *
 * CRITICAL NPCI REQUIREMENT:
 * The 'pa' (Payee Address / VPA) parameter MUST contain a raw '@' character
 * (e.g. `pa=shreeswamisamarth@ybl`), NOT percent-encoded `%40`.
 * Percent-encoding '@' causes PhonePe, Google Pay, and Paytm to fail VPA regex validation
 * and throw the error "Invalid QR code" / "अवैध QR कोड"!
 */
export function buildUpiUri(
  upiId = 'shreeswamisamarth@ybl',
  payeeName = 'NEW SHREE SWAMI SAMARTH TRANSPORT',
  amount?: number,
  transactionNote = 'Transport Freight'
): string {
  const cleanUpi = upiId.trim();
  const cleanName = payeeName.trim().slice(0, 50);
  // NPCI spec: 'pa' must NOT encode '@'.
  // Format: upi://pay?pa=handle@bank&pn=Payee+Name&cu=INR
  const encodedName = encodeURIComponent(cleanName);
  let uri = `upi://pay?pa=${cleanUpi}&pn=${encodedName}&cu=INR`;
  if (amount && Number(amount) > 0) {
    uri += `&am=${Number(amount).toFixed(2)}`;
  }
  if (transactionNote) {
    uri += `&tn=${encodeURIComponent(transactionNote.slice(0, 30))}`;
  }
  return uri;
}

/**
 * Generate a crystal-clear, high-resolution (600px+) scannable QR code Data URL.
 * Uses high contrast black/white and error correction level 'M' or 'H' for instant readability.
 */
export async function generateUpiQrDataUrl(options?: UpiQrOptions): Promise<string> {
  const upiId = options?.upiId || 'shreeswamisamarth@ybl';
  const payeeName = options?.payeeName || 'SHREE SWAMI SAMARTH TRANSPORT';
  const uri = buildUpiUri(upiId, payeeName, options?.amount, options?.transactionNote);

  try {
    return await QRCode.toDataURL(uri, {
      width: options?.width || 600,
      margin: options?.margin ?? 2,
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '/phonepe_qr.jpg';
  }
}
