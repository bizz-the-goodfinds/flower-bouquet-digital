import { ImageResponse } from "next/og";
import { logoSvg } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(logoSvg({ background: "#FBF6EE", radius: 0 })).toString("base64")}`;
  return new ImageResponse(<img src={src} width={180} height={180} alt="" />, size);
}
