"use client";

import Image from "next/image";
import { useState } from "react";

import { profile } from "@/lib/wall";

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const tone = Array.from(name).reduce((total, letter) => total + letter.charCodeAt(0), 0) % 6;

  return (
    <span className={`avatar ${className}`} data-tone={tone} aria-hidden="true">
      {name === profile.name && !imageFailed ? (
        <Image src={profile.photo} alt="" width={80} height={80} sizes="40px" loading="eager" onError={() => setImageFailed(true)} />
      ) : initials}
    </span>
  );
}
