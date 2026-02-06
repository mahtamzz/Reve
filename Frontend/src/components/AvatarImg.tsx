import React from "react";
import { DEFAULT_AVATAR_URL } from "@/constants/avatar";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
};

export function AvatarImg({ src, alt, ...rest }: Props) {
  const safeSrc = src && String(src).trim() ? src : DEFAULT_AVATAR_URL;

  return (
    <img
      {...rest}
      src={safeSrc}
      alt={alt || "avatar"}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(DEFAULT_AVATAR_URL)) {
          img.src = DEFAULT_AVATAR_URL;
        }
        rest.onError?.(e);
      }}
    />
  );
}
