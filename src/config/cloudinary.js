// ─── Cloudinary Client Configuration ────────────────────────────────────────
// Values must be set in .env (local) or Vercel Environment Variables (production).
// ⚠️  NEVER add hardcoded fallback values here — this file is tracked by Git.

if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    console.warn('[Velouraz] Missing VITE_CLOUDINARY_CLOUD_NAME — add it to your .env file.');
  }
  if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    console.warn('[Velouraz] Missing VITE_CLOUDINARY_UPLOAD_PRESET — add it to your .env file.');
  }
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const cloudinaryConfig = {
  cloudName,
  uploadPreset,
  uploadUrl: cloudName
    ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    : '',
  galleryTag: 'velouraz_gallery',
};


export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", cloudinaryConfig.uploadPreset);
  data.append("tags", cloudinaryConfig.galleryTag); // Tag the image for the gallery

  const uploadUrl = file?.type?.startsWith("video/")
    ? cloudinaryConfig.uploadUrl.replace("/image/", "/video/")
    : cloudinaryConfig.uploadUrl;
  const res = await fetch(uploadUrl, {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const result = await res.json();
  return result.secure_url;
};

/**
 * Uploads a file to Cloudinary with real-time percentage progress callback
 */
export const uploadToCloudinaryWithProgress = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", cloudinaryConfig.uploadPreset);
    data.append("tags", cloudinaryConfig.galleryTag);

    const uploadUrl = file?.type?.startsWith("video/")
      ? cloudinaryConfig.uploadUrl.replace("/image/", "/video/")
      : cloudinaryConfig.uploadUrl;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (e) {
          reject(new Error("Invalid upload response"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(data);
  });
};

/**
 * Returns original Cloudinary URL.
 * Transformations are disabled because Strict Transformations are actively blocking them and causing 401s.
 */
export const getOptimizedCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") return url || "";
  return url;
};

/**
 * Shortcut helper for responsive web images
 */
export const getOptimizedImageUrl = (url) => {
  return getOptimizedCloudinaryUrl(url);
};

/**
 * Shortcut helper for Admin & Grid thumbnails
 */
export const getThumbnailUrl = (url) => {
  return getOptimizedCloudinaryUrl(url);
};

/**
 * Shortcut helper for streaming videos cleanly in HTML5 video elements
 */
export const getOptimizedVideoUrl = (url) => {
  if (!url || typeof url !== "string") return url || "";
  return url;
};

/**
 * Image error handler fallback: if transformed image fails, fallback to raw source URL
 */
export const handleImageError = (e, originalUrl) => {
  if (e?.currentTarget && originalUrl) {
    if (e.currentTarget.src !== originalUrl) {
      e.currentTarget.src = originalUrl;
    }
  }
};
