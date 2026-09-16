// ===== Cloudinary configuration =====
// 1. Cloudinary Console → Settings → Upload → "Upload presets" →
//    Add upload preset → Signing Mode: **Unsigned** → Save.
//    (Unsigned is fine here since only admins reach this form, and
//    it's gated by requireAdmin() before any upload UI even renders.)
// 2. Your cloud name is shown at the top of the Cloudinary Console
//    dashboard (Settings → General, or right on the dashboard home).

export const CLOUDINARY_CLOUD_NAME = 'tcwn4cxe';
export const CLOUDINARY_UPLOAD_PRESET = 'Stonefield';