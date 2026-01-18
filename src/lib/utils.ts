import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const roleVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "super_admin": "destructive",
    "admin": "destructive",
    "moderator": "secondary",
    "nitro": "default",
    "user": "outline",
    "guest": "outline",
    "Owner": "default",
    "Editor": "secondary",
    "Viewer": "outline",
};