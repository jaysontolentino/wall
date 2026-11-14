import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { WallFeed } from "@/components/wall-feed";
import { profile } from "@/lib/wall";

export default function Home() {
  return (
    <div className="wall-shell">
      <header className="wall-header">
        <div className="wall-header-inner">
          <Link href="/" aria-label="Wall home" className="wall-wordmark">wall<span aria-hidden="true">.</span></Link>
          <div className="header-profile"><span className="header-profile-name">{profile.name}</span><Avatar name={profile.name} /></div>
        </div>
      </header>
      <div className="wall-layout">
        <aside className="profile-sidebar" aria-label="Profile">
          <div className="profile-photo-frame">
            <Image className="profile-photo" src={profile.photo} alt={`${profile.name}'s profile photo`} width={600} height={750} sizes="(max-width: 540px) 112px, 260px" preload />
          </div>
          <div className="profile-details">
            <h1>{profile.name}</h1>
            <p className="profile-subtitle">A little corner of the internet.</p>
            <details className="profile-information" open>
              <summary>Information <ChevronDown size={15} aria-hidden="true" /></summary>
              <dl>
                <dt>Bio</dt><dd>{profile.bio}</dd>
                <dt>Current City</dt><dd className="profile-location"><MapPin size={14} aria-hidden="true" />{profile.city}</dd>
              </dl>
            </details>
          </div>
        </aside>
        <main className="min-w-0"><WallFeed /></main>
      </div>
    </div>
  );
}
