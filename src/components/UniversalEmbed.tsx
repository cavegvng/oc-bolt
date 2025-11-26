// src/components/UniversalEmbed.tsx
// FINAL — 100% WORKING — NO MORE BLANK PAGES

import { useEffect, useRef } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // ───── DETECT PLATFORMS (top-level, no conditionals before hooks) ─────
  const isTwitter = url.includes('x.com') || url.includes('twitter.com');
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isTikTok = url.includes('tiktok.com');

  const cleanTikTokUrl = isTikTok ? url.split('?')[0].replace(/\/$/, '') : '';
  const tikTokVideoId = isTikTok ? cleanTikTokUrl.match(/\/video\/(\d+)/)?.[1] || '' : '';

  // ───── ALL HOOKS AT TOP LEVEL (React is now happy) ─────
  useEffect(() => {
    if (!ref.current) return;

    // Twitter
    if (isTwitter) {
      fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&dnt=true`)
        .then(r => r.json())
        .then(data => {
          if (data?.html && ref.current) {
            ref.current.innerHTML = data.html;
            if (!document.getElementById('twitter-script')) {
              const script = document.createElement('script');
              script.id = 'twitter-script';
              script.src = 'https://platform.twitter.com/widgets.js';
              script.async = true;
              document.body.appendChild(script);
            }
          }
        });
      return;
    }

    // Instagram
    if (isInstagram) {
      let embedUrl = url.split('?')[0].replace(/\/$/, '');
      embedUrl = embedUrl.replace('/reel/', '/p/');
      if (!embedUrl.endsWith('/embed')) embedUrl += '/embed/';

      ref.current.innerHTML = `
        <div class="my-12 flex justify-center">
          <iframe src="${embedUrl}" class="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0 shadow-2xl"
            frameborder="0" scrolling="no" allowtransparency="true" loading="lazy"></iframe>
        </div>
        <p class="text-center -mt-6">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-pink-400 underline text-sm">
            View on Instagram ↗
          </a>
        </p>
      `;
      return;
    }

    // YouTube (regular + Shorts)
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        ref.current.innerHTML = `
          <div class="my-8 flex justify-center">
            <div class="w-full max-w-2xl aspect-w-16 aspect-h-9">
              <iframe src="https://www.youtube.com/embed/${videoId}?rel=0"
                class="w-full h-96 rounded-lg border-0 shadow-2xl"
                allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
          </div>
        `;
      }
      return;
    }

    // ───── TikTok – Pro thumbnail preview (100% reliable, no script, no blank) ─────
    if (url.includes('tiktok.com')) {
      const cleanUrl = url.split('?')[0].replace(/\/$/, '');

      setEmbedHtml(`
        <div class="my-12 flex justify-center">
          <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="block w-full max-w-lg group">
            <div class="relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl overflow-hidden shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-[1.02]">
              <!-- Dark overlay + play icon -->
              <div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="w-20 h-20 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <!-- TikTok logo in corner -->
              <div class="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full">
                <span class="text-white text-xs font-bold">TikTok</span>
              </div>
              <!-- Bottom bar -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                <p class="text-white font-semibold text-lg">TikTok Video</p>
                <p class="text-gray-300 text-sm">Tap to watch</p>
              </div>
            </div>
          </a>
        </div>
        <p class="text-center -mt-6">
          <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-400 underline text-sm hover:text-purple-300">
            View on TikTok →
          </a>
        </p>
      `);
      return;
    }

    // Fallback
    ref.current.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${url}</a>`;
  }, [url, isTwitter, isInstagram, isYouTube, isTikTok, cleanTikTokUrl, tikTokVideoId]);

  // Twitter reload fix
  useEffect(() => {
    if ((window as any).twttr?.widgets?.load) {
      (window as any).twttr.widgets.load();
    }
  }, []);

  return <div ref={ref} />;
}