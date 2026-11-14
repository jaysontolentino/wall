"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MAX_MESSAGE_LENGTH, PHOTO_BUCKET, PHOTO_TYPES, messageLength, profile, samplePosts, timeAgo, validatePhoto, type Post } from "@/lib/wall";

export function WallFeed() {
  const [supabase] = useState(() => isSupabaseConfigured() ? createClient() : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedError, setFeedError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));
  const [now, setNow] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadedPhoto = useRef<{ file: File; url: string } | null>(null);
  const readVersion = useRef(0);
  const remaining = MAX_MESSAGE_LENGTH - messageLength(body);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function refresh() {
      const version = ++readVersion.current;
      const { data, error } = await supabase!.from("posts")
        .select("id,author_name,body,photo_url,created_at")
        .order("created_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false }).limit(100);
      if (!active || version !== readVersion.current) return;
      setLoading(false);
      if (error) {
        setFeedError("Couldn't load the wall. Check your connection and Supabase setup; we'll retry automatically.");
      } else {
        setPosts(data as Post[]);
        setFeedError("");
      }
    }
    const channel = supabase.channel("wall-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { void refresh(); })
      .subscribe((status) => { if (status === "SUBSCRIBED") void refresh(); });
    void refresh();
    // Polling also keeps the wall fresh if Realtime is unavailable.
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15_000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  function selectPhoto(file: File | undefined) {
    if (!file) return;
    setNotice("");
    const problem = validatePhoto(file);
    if (problem) {
      setError(problem);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    uploadedPhoto.current = null;
    setError("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
    uploadedPhoto.current = null;
    if (fileInput.current) fileInput.current.value = "";
  }

  async function share(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (!supabase) {
      setError("Connect your Supabase project to share a post. See the setup instructions in README.md.");
      return;
    }
    if (remaining < 0 || (!body.trim() && !photo)) return;
    setBusy(true);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const problem = validatePhoto(photo);
        if (problem) throw new Error(problem);
        if (uploadedPhoto.current?.file === photo) {
          photoUrl = uploadedPhoto.current.url;
        } else {
          const path = `posts/${crypto.randomUUID()}.${PHOTO_TYPES[photo.type]}`;
          const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET)
            .upload(path, photo, { contentType: photo.type, upsert: false });
          if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}. Check that the public "${PHOTO_BUCKET}" bucket and upload policy are set up (README.md).`);
          photoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
          uploadedPhoto.current = { file: photo, url: photoUrl };
        }
      }
      const { data, error: postError } = await supabase.from("posts")
        .insert({ author_name: profile.name, body: body.trim(), photo_url: photoUrl })
        .select("id,author_name,body,photo_url,created_at").single();
      if (postError) throw new Error(`Couldn't share your post: ${postError.message}. Your draft is saved here; please try again.`);
      ++readVersion.current;
      setPosts((current) => [data as Post, ...current.filter((post) => post.id !== data.id)].slice(0, 100));
      setNow(Date.now());
      setBody("");
      clearPhoto();
      setNotice("Your post was shared.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't share your post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wall-content" aria-label={`${profile.name}'s wall`}>
      <form className="composer" onSubmit={share}>
        <fieldset disabled={busy} className="min-w-0 space-y-3">
          <legend className="sr-only">Write on the wall</legend>
          <label className="sr-only" htmlFor="message">What&apos;s on your mind?</label>
          <textarea id="message" className="message-input" placeholder="What's on your mind?" value={body} onChange={(event) => setBody(Array.from(event.target.value).slice(0, MAX_MESSAGE_LENGTH).join(""))} aria-describedby="character-count" rows={4} />
          <p id="character-count" className="character-count">{remaining} characters remaining</p>
          <input ref={fileInput} id="post-photo" type="file" accept="image/jpeg,image/png,image/gif" className="sr-only" onChange={(event) => selectPhoto(event.target.files?.[0])} />
          {photo && preview ? (
            <div className="photo-preview">
              <Image src={preview} alt="Selected photo preview" width={480} height={360} unoptimized className="max-h-64 w-auto rounded object-contain" />
              <button type="button" className="remove-photo" onClick={clearPhoto} aria-label="Remove selected photo"><X size={16} /></button>
              <span className="mt-2 block truncate text-xs text-slate-500">{photo.name}</span>
            </div>
          ) : (
            <button type="button" className="upload-area" onClick={() => fileInput.current?.click()}>
              <ImagePlus size={23} strokeWidth={1.5} aria-hidden="true" />
              <span>Click to add photo <span className="font-normal">(optional)</span></span>
              <span className="text-[11px] text-slate-400">JPG, PNG, GIF up to 5 MB</span>
            </button>
          )}
          <div className="flex min-h-9 items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Write a little. Share a moment.</span>
            <Button type="submit" disabled={busy || (!body.trim() && !photo) || !supabase} className="share-button">
              {busy && <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />}
              {busy ? "Sharing…" : "Share"}
            </Button>
          </div>
        </fieldset>
        {error && <p role="alert" className="form-error">{error}</p>}
        <p role="status" className="text-sm text-emerald-700">{notice}</p>
      </form>
      {!supabase && <p className="feed-notice">Sample wall · Connect Supabase to share posts.</p>}
      {feedError && <p role="status" className="feed-notice">{feedError}</p>}
      {loading && <p role="status" className="py-3 text-sm text-slate-500">Loading the wall…</p>}
      <div aria-label="Wall posts" aria-busy={loading}>
        {posts.map((post) => (
          <article key={post.id} className="wall-post">
            <div className="post-heading">
              <h2>{post.author_name || profile.name}</h2>
              <time dateTime={post.created_at ?? undefined} title={post.created_at ? new Date(post.created_at).toLocaleString() : undefined}>{now ? timeAgo(post.created_at, now) : ""}</time>
            </div>
            {post.body && <p className="post-body">{post.body}</p>}
            {post.photo_url && <Image src={post.photo_url} alt={`Photo shared by ${post.author_name || profile.name}`} width={640} height={480} unoptimized className="post-photo" />}
          </article>
        ))}
        {samplePosts.map((post) => (
          <article key={post.name} className="wall-post">
            <div className="post-heading"><h2>{post.name}</h2><span>{post.age}</span></div>
            <p className="post-body">{post.body}</p>
          </article>
        ))}
      </div>
      <p className="sample-note">Posts from Anna and friends are sample messages.</p>
    </section>
  );
}
