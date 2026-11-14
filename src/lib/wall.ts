export const PHOTO_BUCKET = "wall-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_MESSAGE_LENGTH = 280;
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

// Replace the image path and these details to make the wall yours.
export const profile = {
  name: "Jayson Tolentino",
  photo: "/profile.jpg",
  bio: "Add a short bio about yourself.",
  city: "Pampanga, PH",
};

export type Post = {
  id: string;
  author_name: string;
  body: string | null;
  photo_url: string | null;
  created_at: string | null;
};

export const samplePosts = [
  {
    name: "Anna",
    body: "Hey, did you debug your coffee maker yet? Last cup tasted like JavaScript errors.",
    age: "2h",
  },
  {
    name: "Adelaida",
    body: "Saw your last coding session—pretty sure you broke Stack Overflow again! ☕",
    age: "3h",
  },
  {
    name: "Juho",
    body: "Are you still coding in pajamas, or have you upgraded to full-time sweatpants mode?",
    age: "4h",
  },
  {
    name: "Maija",
    body: "Rumor has it your computer has more stickers than code running on it. Confirm?",
    age: "5h",
  },
  {
    name: "Alex",
    body: "Just pulled an all-nighter on the assignment. Turns out sleep deprivation doesn't improve coding skills. Weird!",
    age: "6h",
  },
  {
    name: "Sheryl",
    body: "When are we gonna deploy your latest dance moves to production? #AgileDancer",
    age: "8h",
  },
];

export function messageLength(value: string) {
  return Array.from(value).length;
}

export function validatePhoto(file: Pick<File, "size" | "type">) {
  if (!PHOTO_TYPES[file.type]) return "Choose a JPG, PNG, or GIF photo.";
  if (file.size === 0)
    return "This photo is empty. Please choose another file.";
  if (file.size > MAX_PHOTO_BYTES) return "Your photo must be 5 MB or smaller.";
  return null;
}

export function timeAgo(value: string | null, now: number) {
  if (!value) return "";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}
