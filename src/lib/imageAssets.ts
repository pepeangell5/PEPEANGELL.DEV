export type ResponsiveImageAsset = {
  avifSrcSet?: string;
  fallback: string;
  height: number;
  webpSrcSet: string;
  width: number;
};

export const mascotImage = {
  icon: "/assets/optimized/mascot-esp32-tools-v2-96.9a7599fe80.webp",
  fallback: "/assets/optimized/mascot-esp32-tools-v2-768.1221b65d2b.webp",
  srcSet: [
    ["/assets/optimized/mascot-esp32-tools-v2-384.bb52e92588.webp", 384],
    ["/assets/optimized/mascot-esp32-tools-v2-768.1221b65d2b.webp", 768],
    ["/assets/optimized/mascot-esp32-tools-v2-1254.f6e17cb744.webp", 1254]
  ] as const
};

export const shopProductImageSizes =
  "(max-width: 760px) calc(100vw - 40px), (max-width: 1240px) calc(50vw - 40px), 540px";

export const shopProductImages: Record<string, ResponsiveImageAsset> = {
  "rf-kill-esp32-devkit": {
    avifSrcSet:
      "/assets/optimized/esp32-devkit-kit-480.6939781065.avif 480w, /assets/optimized/esp32-devkit-kit-720.575ba5875e.avif 720w",
    fallback: "/assets/optimized/esp32-devkit-kit-720.9fe47e4cc5.webp",
    height: 1280,
    webpSrcSet:
      "/assets/optimized/esp32-devkit-kit-480.2ade936df6.webp 480w, /assets/optimized/esp32-devkit-kit-720.9fe47e4cc5.webp 720w",
    width: 720
  },
  "rf-kill-esp32-c3-supermini": {
    avifSrcSet:
      "/assets/optimized/esp32-c3-supermini-kit-480.49b57bdffe.avif 480w, /assets/optimized/esp32-c3-supermini-kit-720.ef8466f4d2.avif 720w",
    fallback: "/assets/optimized/esp32-c3-supermini-kit-720.19cdd1160f.webp",
    height: 1280,
    webpSrcSet:
      "/assets/optimized/esp32-c3-supermini-kit-480.6dc2e36f8f.webp 480w, /assets/optimized/esp32-c3-supermini-kit-720.19cdd1160f.webp 720w",
    width: 720
  }
};
