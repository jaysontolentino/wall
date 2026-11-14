import Image from "next/image";
import Link from "next/link";

import { WallFeed } from "@/components/wall-feed";
import { profile } from "@/lib/wall";

export default function Home() {
  return (
    <div className="wall-shell">
      <header className="wall-header"><Link href="/" aria-label="Wall home">wall</Link></header>
      <div className="wall-layout">
        <aside className="profile-sidebar" aria-label="Profile">
          <Image className="profile-photo" src={profile.photo} alt={`${profile.name}'s profile photo placeholder`} width={600} height={750} preload />
          <div className="profile-details">
            <h1>{profile.name}</h1>
            <p className="profile-subtitle">wall</p>
            <details className="profile-information" open>
              <summary>Information</summary>
              <dl>
                <dt>Bio</dt><dd>{profile.bio}</dd>
                <dt>Current City</dt><dd>{profile.city}</dd>
              </dl>
            </details>
          </div>
        </aside>
        <main className="min-w-0"><WallFeed /></main>
      </div>
    </div>
  );
}
