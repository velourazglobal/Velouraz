import React, { useState } from "react";
import {
  getOptimizedImageUrl,
  getThumbnailUrl,
  getImageSrcSet,
  handleImageError,
} from "../../config/cloudinary";

/**
 * OptimizedImage Component
 * High-performance, responsive, layout-shift-free image component.
 *
 * - Automatically injects f_auto, q_auto and width constraints for Cloudinary & Unsplash images.
 * - Supports native responsive srcset & sizes.
 * - Configures eager loading + fetchpriority="high" for above-the-fold hero images.
 * - Uses native loading="lazy" + decoding="async" for below-the-fold images.
 * - Prevents Cumulative Layout Shift (CLS) via aspect-ratio and explicit dimensions.
 * - Implements automatic error recovery fallback without displaying broken icons.
 */
const OptimizedImage = ({
  src,
  alt = "",
  width,
  height,
  aspectRatio,
  priority = false, // True for above-the-fold critical LCP images
  sizes,
  widths,
  crop = "limit",
  quality = "auto",
  className = "",
  style = {},
  objectFit = "cover",
  objectPosition,
  fallbackSrc,
  onLoad,
  onError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src) {
    return (
      <div
        className={`bg-[#FAF6F0] flex items-center justify-center ${className}`}
        style={{
          aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
          width: width || "100%",
          height: height || "100%",
          ...style,
        }}
        aria-hidden="true"
      />
    );
  }

  // Optimize base src
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: width || (crop !== "limit" ? undefined : undefined),
    height,
    crop,
    quality,
  });

  // Generate responsive srcset if widths are provided or if responsive
  const srcSetString = widths
    ? getImageSrcSet(src, widths, { crop, quality })
    : undefined;

  const combinedStyle = {
    objectFit,
    ...(objectPosition ? { objectPosition } : {}),
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  const handleErr = (e) => {
    setHasError(true);
    handleImageError(e, fallbackSrc || src);
    if (onError) onError(e);
  };

  return (
    <img
      src={hasError ? fallbackSrc || src : optimizedSrc}
      srcSet={hasError ? undefined : srcSetString}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={handleErr}
      onLoad={onLoad}
      className={className}
      style={combinedStyle}
      {...rest}
    />
  );
};

export default OptimizedImage;

