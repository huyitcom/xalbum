import * as dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

interface CustomerDetails {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface SpreadFile {
  name: string;
  pageNumber?: number;
  dataUrl: string;
}

interface OrderPayload {
  customerDetails?: CustomerDetails;
  groomName?: string;
  brideName?: string;
  connector?: string;
  weddingDate?: string;
  albumSize?: string;
  size?: string;
  pageCount?: number | string;
  materialId?: string;
  materialName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  designImageData?: string | null;
  spreads?: SpreadFile[];
  projectData?: any;
}

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
try {
  if (!process.env.VERCEL && !fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create uploads directory (expected on Vercel):', e);
}

// SMTP Configuration from Photobook Vietnam
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  user: process.env.SMTP_USER || 'photobookvietnam.net@gmail.com',
  pass: process.env.SMTP_PASS || 'pmgy mera pmts gfgp',
};

// Target Notification Emails
const TARGET_EMAILS = [
  process.env.ADMIN_EMAIL || 'photobookgiare@gmail.com',
  'photobookvietnam.net@gmail.com',
];

// Generate Order Email HTML Template with Direct Print Download Links & Details
function generateOrderEmailHtml(
  order: OrderPayload,
  savedSpreads: Array<{ name: string; pageNumber?: number; downloadUrl: string }>,
  serverFolderPath: string
): { subject: string; html: string; text: string } {
  const customerName = order.customerDetails?.fullName || order.customerName || 'Khách hàng';
  const phone = order.customerDetails?.phone || order.customerPhone || 'Chưa cung cấp';
  const email = order.customerDetails?.email || order.customerEmail || 'Không có';
  const address = order.customerDetails?.address || order.customerAddress || 'Tư vấn giao hàng tận nơi';

  const groom = order.groomName || 'Chú rể';
  const bride = order.brideName || 'Cô dâu';
  const weddingDate = order.weddingDate || 'Chưa rõ';
  const size = order.albumSize || order.size || '50 x 35 cm';
  const pageCount = order.pageCount || savedSpreads.length || 1;
  const material = order.materialName || 'Album Ruột Dày Siêu Sắc Nét';
  const notes = order.notes || 'Không có';

  const now = new Date();
  const timeString = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const subject = `New Photobook Order Received: ${customerName} (${groom} & ${bride}) - SĐT: ${phone}`;

  const spreadsHtml = savedSpreads.map((spread, idx) => `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong style="color: #0369a1; font-size: 14px;">📄 Trang ${spread.pageNumber || idx + 1}: ${spread.name}</strong>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Chuẩn in 300 DPI độ nét cao</div>
      </div>
      <a href="${spread.downloadUrl}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;" target="_blank">
        📥 Tải Trang ${spread.pageNumber || idx + 1}
      </a>
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1c1917; background-color: #f5f5f4; margin: 0; padding: 20px; }
    .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0284c7, #0ea5e9); padding: 24px 28px; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; color: #e0f2fe; }
    .body { padding: 24px 28px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 4px; }
    .section-title:first-child { margin-top: 0; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 14px; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f5f5f4; vertical-align: top; }
    .table td.label { width: 160px; color: #78716c; font-weight: 500; }
    .table td.value { color: #1c1917; font-weight: 600; }
    .highlight { color: #0284c7; font-weight: 700; }
    .btn-container { margin: 22px 0 10px 0; text-align: center; }
    .btn-zalo { display: inline-block; background: #0068ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 6px rgba(0,104,255,0.3); }
    .folder-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; font-family: monospace; font-size: 13px; color: #334155; margin: 12px 0; word-break: break-all; }
    .footer { background: #fafaf9; padding: 16px 28px; font-size: 12px; color: #a8a29e; text-align: center; border-top: 1px solid #f5f5f4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🔔 CÓ ĐƠN ĐẶT IN ALBUM MỚI</h1>
      <p>Hệ thống Thiết Kế & Đặt In Photobook Vietnam (Ghi nhận tự động)</p>
    </div>
    <div class="body">
      <div class="section-title">THÔNG TIN KHÁCH HÀNG & GIAO HÀNG</div>
      <table class="table">
        <tr>
          <td class="label">Họ & Tên khách:</td>
          <td class="value highlight">${customerName}</td>
        </tr>
        <tr>
          <td class="label">Số điện thoại / Zalo:</td>
          <td class="value"><a href="tel:${phone}" style="color:#0284c7; text-decoration:none; font-size:15px; font-weight:700;">${phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email khách:</td>
          <td class="value">${email}</td>
        </tr>
        <tr>
          <td class="label">Địa chỉ nhận hàng:</td>
          <td class="value">${address}</td>
        </tr>
        <tr>
          <td class="label">Ghi chú từ khách:</td>
          <td class="value">${notes}</td>
        </tr>
        <tr>
          <td class="label">Thời gian đặt:</td>
          <td class="value" style="font-size:12px; color:#78716c;">${timeString}</td>
        </tr>
      </table>

      <div class="section-title">QUY CÁCH ALBUM & IN ẤN</div>
      <table class="table">
        <tr>
          <td class="label">Dâu Rể:</td>
          <td class="value highlight">${groom} & ${bride}</td>
        </tr>
        <tr>
          <td class="label">Ngày cưới:</td>
          <td class="value">${weddingDate}</td>
        </tr>
        <tr>
          <td class="label">Kích thước Album:</td>
          <td class="value">${size}</td>
        </tr>
        <tr>
          <td class="label">Tổng số trang:</td>
          <td class="value">${pageCount} trang</td>
        </tr>
        <tr>
          <td class="label">Chất liệu ruột/bìa:</td>
          <td class="value highlight">${material}</td>
        </tr>
      </table>

      <div class="section-title">📁 VỊ TRÍ LƯU FILE TRÊN SERVER</div>
      <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Toàn bộ file in gốc 300 DPI và dữ liệu order_details.json đã được lưu tại:</p>
      <div class="folder-box">
        📂 <b>${serverFolderPath}</b>
      </div>

      <div class="section-title">🖼 DANH SÁCH FILE IN TỪNG TRANG (${savedSpreads.length} FILE)</div>
      ${spreadsHtml}

      <div class="btn-container">
        <a href="https://zalo.me/${phone.replace(/[^0-9]/g, '')}" class="btn-zalo" target="_blank">
          💬 Bấm Để Mở Chat Zalo Với Khách Hàng (${phone})
        </a>
      </div>
    </div>
    <div class="footer">
      Email thông báo đơn hàng tự động từ PTBVN Album Builder.<br>
      Gửi tới quản trị viên: <b>${TARGET_EMAILS.join(', ')}</b>.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
NEW PHOTOBOOK ORDER RECEIVED
==============================================
Khách hàng: ${customerName}
Số điện thoại: ${phone}
Email: ${email}
Địa chỉ: ${address}
Ghi chú: ${notes}

QUY CÁCH SẢN PHẨM:
- Dâu Rể: ${groom} & ${bride}
- Ngày cưới: ${weddingDate}
- Kích thước: ${size}
- Số trang: ${pageCount} trang
- Chất liệu: ${material}

VỊ TRÍ LƯU SERVER:
${serverFolderPath}

DANH SÁCH FILE IN:
${savedSpreads.map(s => `- Trang ${s.pageNumber}: ${s.downloadUrl}`).join('\n')}
==============================================
Chat Zalo: https://zalo.me/${phone.replace(/[^0-9]/g, '')}
  `.trim();

  return { subject, html, text };
}

// Process and save project, then send email
async function handleOrderSubmission(
  order: OrderPayload,
  baseUrl: string
): Promise<{
  success: boolean;
  targetEmail: string;
  projectFolder: string;
  savedFiles: Array<{ name: string; downloadUrl: string }>;
  error?: string;
}> {
  const customerName = order.customerDetails?.fullName || order.customerName || 'Khach-hang';
  const sanitizedName = customerName.toLowerCase().replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
  
  const now = new Date();
  const dateFolder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const timestamp = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  
  const relativeProjectFolder = `uploads/${dateFolder}/${sanitizedName}_${timestamp}`;
  const absoluteProjectFolder = path.join(process.cwd(), relativeProjectFolder);
  
  if (!process.env.VERCEL) {
    try {
      fs.mkdirSync(absoluteProjectFolder, { recursive: true });
    } catch(e) {
      console.warn('Could not create project folder', e);
    }
  }

  // 1. Save order_details.json
  const orderDetails = {
    customerDetails: {
      fullName: customerName,
      phone: order.customerDetails?.phone || order.customerPhone || '',
      email: order.customerDetails?.email || order.customerEmail || '',
      address: order.customerDetails?.address || order.customerAddress || '',
    },
    groomName: order.groomName || '',
    brideName: order.brideName || '',
    weddingDate: order.weddingDate || '',
    albumSize: order.albumSize || order.size || '50x35',
    pageCount: order.pageCount || (order.spreads ? order.spreads.length : 1),
    materialId: order.materialId || '',
    materialName: order.materialName || '',
    notes: order.notes || '',
    createdAt: now.toISOString(),
  };
  
  if (!process.env.VERCEL) {
    try {
      fs.writeFileSync(
        path.join(absoluteProjectFolder, 'order_details.json'),
        JSON.stringify(orderDetails, null, 2),
        'utf8'
      );
    } catch(e) {}
  }

  // 2. Save Spread Images (Trang_01.jpg, Trang_02.jpg...)
  const savedSpreads: Array<{ name: string; pageNumber?: number; downloadUrl: string }> = [];

  if (order.spreads && Array.isArray(order.spreads) && order.spreads.length > 0) {
    for (let i = 0; i < order.spreads.length; i++) {
      const spread = order.spreads[i];
      const pageNum = spread.pageNumber || i + 1;
      const fileName = spread.name || `Trang_${String(pageNum).padStart(2, '0')}.jpg`;
      
      if (spread.dataUrl && spread.dataUrl.startsWith('data:image')) {
        const base64Data = spread.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(absoluteProjectFolder, fileName);
        
        if (!process.env.VERCEL) {
          try {
            fs.writeFileSync(filePath, buffer);
          } catch(e) {}
        }
        
        savedSpreads.push({
          name: fileName,
          pageNumber: pageNum,
          downloadUrl: `${baseUrl}/${relativeProjectFolder}/${fileName}`,
        });
      }
    }
  } else if (order.designImageData && order.designImageData.startsWith('data:image')) {
    // Single page fallback
    const fileName = `Trang_01.jpg`;
    const base64Data = order.designImageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(absoluteProjectFolder, fileName);
    
    if (!process.env.VERCEL) {
      try {
        fs.writeFileSync(filePath, buffer);
      } catch(e) {}
    }

    savedSpreads.push({
      name: fileName,
      pageNumber: 1,
      downloadUrl: `${baseUrl}/${relativeProjectFolder}/${fileName}`,
    });
  }

  // 3. Send Email Notification
  const { subject, html, text } = generateOrderEmailHtml(order, savedSpreads, relativeProjectFolder);
  const targetEmailStr = TARGET_EMAILS.join(', ');

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass,
      },
    });

    const mailOptions: any = {
      from: `"PTBVN Album Builder" <${SMTP_CONFIG.user}>`,
      to: TARGET_EMAILS,
      replyTo: order.customerDetails?.email || order.customerEmail || undefined,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP Gmail Success] Order email sent! MessageId:', info.messageId);

    return {
      success: true,
      targetEmail: targetEmailStr,
      projectFolder: relativeProjectFolder,
      savedFiles: savedSpreads,
    };
  } catch (err: any) {
    console.error('[SMTP Gmail Error]', err);
    return {
      success: false,
      targetEmail: targetEmailStr,
      projectFolder: relativeProjectFolder,
      savedFiles: savedSpreads,
      error: err.message,
    };
  }
}

export const app = express();
const PORT = 3000;

// CORS Support for seamless API communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Support large payload for multiple 300DPI spreads
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Static directory for uploaded master print files
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Cloudinary Initialization
function getCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Bạn cần cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong biến môi trường (Environment Variables) trên Vercel để lưu file ảnh.');
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    smtpUser: SMTP_CONFIG.user,
    targetEmails: TARGET_EMAILS,
    uploadsDir: UPLOADS_DIR,
    cloudinaryConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  });
});

// API: Initialize order project folder
app.post('/api/order/init', (req, res) => {
  try {
    const { customerName = 'Khach' } = req.body || {};
    const sanitizedName = String(customerName).toLowerCase().replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
    const timestamp = Date.now();
    const orderId = `${sanitizedName}_${timestamp}`;
    res.json({ success: true, projectFolder: orderId });
  } catch (err: any) {
    console.error('[Order Init Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi khởi tạo đơn hàng' });
  }
});

// API: Generate signature for direct client-to-Cloudinary upload (bypasses Vercel 4.5MB payload limit)
app.post('/api/order/sign-upload', (req, res) => {
  try {
    const { folder, public_id } = req.body || {};
    const timestamp = Math.round(new Date().getTime() / 1000);

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({
        success: false,
        error: 'Chưa cấu hình biến môi trường CLOUDINARY trên Vercel (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
      });
    }

    const cld = getCloudinary();
    const paramsToSign: Record<string, any> = {
      timestamp: timestamp,
    };
    if (folder) paramsToSign.folder = folder;
    if (public_id) paramsToSign.public_id = public_id;

    const signature = cld.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

    res.json({
      success: true,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      public_id
    });
  } catch (err: any) {
    console.error('[Sign Upload Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tạo chữ ký Cloudinary' });
  }
});

// API: Upload a single page to Cloudinary via server fallback
app.post('/api/order/upload-page', async (req, res) => {
  try {
    const { projectFolder, pageNumber, dataUrl } = req.body || {};
    if (!projectFolder || !dataUrl) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin projectFolder hoặc dataUrl' });
    }

    const cld = getCloudinary();
    const fileName = `Trang_${String(pageNumber || 1).padStart(2, '0')}`;
    const folderPath = `photobook_orders/${projectFolder}`;

    const result = await cld.uploader.upload(dataUrl, {
      folder: folderPath,
      public_id: fileName,
      resource_type: 'image'
    });

    res.json({ success: true, fileName, url: result.secure_url });
  } catch (err: any) {
    console.error('[Cloudinary Upload Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi lưu trữ ảnh lên Cloudinary' });
  }
});

// API: Finalize order and send email
app.post('/api/order/finalize', async (req, res) => {
  try {
    const { projectFolder, orderData, uploadedPages } = req.body || {};
    if (!projectFolder) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin projectFolder' });
    }

    // 1. Format pages for email
    const savedSpreads = (uploadedPages || []).map((p: any) => ({
      name: `Trang_${String(p.pageNumber || 1).padStart(2, '0')}.jpg`,
      pageNumber: p.pageNumber,
      downloadUrl: p.url
    })).sort((a: any, b: any) => a.pageNumber - b.pageNumber);

    // 2. Send Email
    const { subject, html, text } = generateOrderEmailHtml(orderData || {}, savedSpreads, `Cloudinary Folder: photobook_orders/${projectFolder}`);
    const targetEmailStr = TARGET_EMAILS.join(', ');

    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: { user: SMTP_CONFIG.user, pass: SMTP_CONFIG.pass },
    });

    const mailOptions = {
      from: `"PTBVN Album Builder" <${SMTP_CONFIG.user}>`,
      to: TARGET_EMAILS,
      replyTo: orderData?.customerDetails?.email || orderData?.customerEmail || undefined,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP Gmail Success] Order finalized and email sent! MessageId:', info.messageId);

    res.json({
      success: true,
      project_folder: projectFolder,
      files: savedSpreads,
      targetEmail: targetEmailStr,
    });
  } catch (err: any) {
    console.error('[Finalize Error]', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Lỗi gửi email thông báo đơn hàng'
    });
  }
});

app.post('/api/order/submit', async (req, res) => {
  const orderData: OrderPayload = req.body;
  console.log('=== [NHẬN ĐƠN ĐẶT IN ALBUM MỚI] === Khách:', orderData.customerDetails?.fullName || orderData.customerName, 'SĐT:', orderData.customerDetails?.phone || orderData.customerPhone);

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;

  const result = await handleOrderSubmission(orderData, baseUrl);

  res.json({
    status: result.success ? 'success' : 'saved_with_email_warning',
    success: result.success,
    message: result.success ? 'Project submitted successfully.' : 'Saved project to server.',
    project_folder: result.projectFolder,
    files: result.savedFiles,
    targetEmail: result.targetEmail,
    error: result.error,
  });
});



export default app;

