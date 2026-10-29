// ─── Cloudinary Client Configuration & Performance Optimization Engine ───────
// Values must be set in .env (local) or Vercel Environment Variables (production).
// ⚠️  NEVER add hardcoded fallback secrets here — this file is tracked by Git.

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

/**
 * Uploads a file to Cloudinary directly via browser unsigned preset
 */
export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", cloudinaryConfig.uploadPreset);
  data.append("tags", cloudinaryConfig.galleryTag);

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
 * Core Cloudinary URL transformer
 * Safely parses upload path, merges transformations, handles existing transformations,
 * respects signed URLs, and generates browser-optimal f_auto,q_auto delivery URLs.
 */
export const buildOptimizedCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") return url || "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Cloudinary URL pattern: https://res.cloudinary.com/<cloudName>/<image|video>/upload/...
  const cloudinaryUploadRegex = /^(https?:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/)(.*)$/i;
  const match = trimmed.match(cloudinaryUploadRegex);

  // If not Cloudinary, handle external CDNs (like Unsplash) or return original
  if (!match) {
    if (trimmed.includes("images.unsplash.com") && options.width) {
      try {
        const u = new URL(trimmed);
        u.searchParams.set("w", String(Math.round(options.width)));
        u.searchParams.set("auto", "format");
        if (options.quality) u.searchParams.set("q", String(options.quality));
        return u.toString();
      } catch (e) {
        return trimmed;
      }
    }
    return trimmed;
  }

  const prefix = match[1];
  const rest = match[4];

  // Signed URL safety: if URL contains signature (e.g. s--...--/), never tamper with transformations
  if (/^s--[^/]+--\//.test(rest)) {
    return trimmed;
  }

  // Parse existing segments between /upload/ and the public_id / version
  const segments = rest.split("/");
  let existingTransformations = [];
  let pathStartIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Version stamp: v123456789
    if (/^v\d+$/.test(seg)) {
      pathStartIndex = i;
      break;
    }
    // File name with extension
    if (i === segments.length - 1 || (seg.includes(".") && !seg.includes(","))) {
      pathStartIndex = i;
      break;
    }
    // Transformation tokens
    if (/^(c_|w_|h_|q_|f_|dpr_|g_|e_|r_|b_|o_|fl_|so_|eo_|du_|vc_|[a-z0-9_]+,[a-z0-9_]+)/.test(seg)) {
      existingTransformations.push(seg);
    } else {
      pathStartIndex = i;
      break;
    }
  }

  const publicPath = segments.slice(pathStartIndex).join("/");

  const {
    width,
    height,
    crop = (width || height) ? "limit" : undefined, // c_limit prevents distorting/upscaling
    quality = "auto",
    format = "auto",
    aspectRatio,
    gravity,
    blur,
  } = options;

  const transParts = [];

  if (width && Number(width) > 0) {
    transParts.push(`w_${Math.round(Number(width))}`);
  }
  if (height && Number(height) > 0) {
    transParts.push(`h_${Math.round(Number(height))}`);
  }
  if (crop && (width || height)) {
    transParts.push(`c_${crop}`);
  }
  if (aspectRatio) {
    transParts.push(`ar_${aspectRatio}`);
  }
  if (gravity) {
    transParts.push(`g_${gravity}`);
  }
  if (blur) {
    transParts.push(`e_blur:${blur}`);
  }

  // WebP/AVIF auto-negotiation
  if (format) {
    transParts.push(`f_${format}`);
  }

  // Auto quality optimization
  if (quality) {
    transParts.push(`q_${quality}`);
  }

  const newTransString = transParts.join(",");

  if (existingTransformations.length > 0) {
    const cleanExisting = existingTransformations.filter((t) => {
      if (format && t.includes("f_")) return false;
      if (quality && t.includes("q_")) return false;
      if (width && t.includes("w_")) return false;
      if (height && t.includes("h_")) return false;
      return true;
    });
    if (newTransString) cleanExisting.push(newTransString);
    const finalTrans = cleanExisting.join("/");
    return `${prefix}${finalTrans}/${publicPath}`;
  }

  return `${prefix}${newTransString}/${publicPath}`;
};

/**
 * Returns optimized Cloudinary URL with f_auto, q_auto and optional dimensions
 */
export const getOptimizedCloudinaryUrl = (url, options = {}) => {
  return buildOptimizedCloudinaryUrl(url, options);
};

/**
 * Primary helper for responsive web images with automatic format & quality selection
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  return buildOptimizedCloudinaryUrl(url, {
    quality: "auto",
    format: "auto",
    ...options,
  });
};

/**
 * Thumbnail helper for product cards, cart items, admin previews (defaults to 320px width limit)
 */
export const getThumbnailUrl = (url, size = 320) => {
  return buildOptimizedCloudinaryUrl(url, {
    width: size,
    crop: "limit",
    quality: "auto",
    format: "auto",
  });
};

/**
 * Generates responsive srcset string for high-DPI displays and multiple viewports
 * e.g. [320, 640, 960, 1280] => ".../w_320,c_limit,f_auto,q_auto/... 320w, ..."
 */
export const getImageSrcSet = (url, widths = [320, 480, 640, 800, 1024, 1280], options = {}) => {
  if (!url || typeof url !== "string") return undefined;
  const isCloudinary = url.includes("res.cloudinary.com");
  const isUnsplash = url.includes("images.unsplash.com");

  if (!isCloudinary && !isUnsplash) {
    return undefined;
  }

  return widths
    .map((w) => {
      const optUrl = buildOptimizedCloudinaryUrl(url, {
        ...options,
        width: w,
        crop: options.crop || "limit",
      });
      return `${optUrl} ${w}w`;
    })
    .join(", ");
};

/**
 * Safe video URL optimization
 * Verified: dcjn4y284 supports f_auto,q_auto; dy1g9f3bj uses clean original to prevent 401 on strict plans
 */
export const getOptimizedVideoUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") return url || "";
  const trimmed = url.trim();

  // If Cloudinary video on verified cloud (dcjn4y284)
  if (trimmed.includes("res.cloudinary.com/dcjn4y284/video/upload/")) {
    const widthParam = options.width ? `w_${Math.round(options.width)},c_limit,` : "";
    return trimmed.replace("/video/upload/", `/video/upload/${widthParam}f_auto,q_auto/`);
  }

  // dy1g9f3bj (free plan without signed video transformation access): safely preserve original URL
  return trimmed;
};

/**
 * Generates an automatic video poster frame image from Cloudinary video (at so_0)
 */
export const getVideoPosterUrl = (videoUrl, options = {}) => {
  if (!videoUrl || typeof videoUrl !== "string") return options.fallback || undefined;
  const trimmed = videoUrl.trim();

  if (trimmed.includes("res.cloudinary.com/dcjn4y284/video/upload/")) {
    const widthParam = options.width ? `w_${Math.round(options.width)},c_limit,` : "";
    return trimmed
      .replace("/video/upload/", `/video/upload/${widthParam}so_0,f_auto,q_auto/`)
      .replace(/\.[a-zA-Z0-9]+$/, ".jpg");
  }

  return options.fallback || undefined;
};

/**
 * Robust image error handler fallback:
 * 1. If transformed image URL fails, falls back immediately to raw original source URL.
 * 2. If original URL also fails, sets a subtle inline data placeholder to prevent broken-image icons.
 */
export const handleImageError = (e, originalUrl) => {
  if (!e?.currentTarget) return;
  const target = e.currentTarget;

  if (originalUrl && target.src !== originalUrl) {
    target.src = originalUrl;
    return;
  }

  // Graceful fallback to prevent broken browser icon if image is missing from server
  target.onerror = null; // Prevent loop
  target.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23FAF6F0'/%3E%3C/svg%3E";
};

/**
 * Video playback error fallback: reverts to original raw video URL
 */
export const handleVideoError = (e, originalUrl) => {
  if (e?.currentTarget && originalUrl && e.currentTarget.src !== originalUrl) {
    e.currentTarget.src = originalUrl;
  }
};
