import { useEffect, useState } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState('');

  useEffect(() => {
    if (!url) return;

    // ───── X / Twitter ─────
    if (url.includes('x.com') || url.includes('twitter.com')) {
      fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&dnt=true`)
        .then(r => r.json())
        .then(data => {
          if (data?.html) {
            setEmbedHtml(data.html);
            if (!document.getElementById('twitter-oembed-script')) {
              const script = document.createElement('script');
              script.id = 'twitter-oembed-script';
              script.async = true;
              script.src = 'https://platform.twitter.com/widgets.js';
              document.body.appendChild(script);
            }
          }
        })
        .catch(() => setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">View on X ↗</a>`));
      return;
    }

    // ───── Instagram (Posts embed, Reels get beautiful card) ─────
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      const cleanUrl = url.split('?')[0].replace(/\/$/, '');

      // REELS → beautiful card
      if (cleanUrl.includes('/reel/')) {
        setEmbedHtml(`
          <div class="my-12 flex justify-center">
            <div class="w-full max-w-lg h-96 md:h-[680px] bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-lg flex flex-col items-center justify-center text-center p-8 shadow-2xl">
              <div class="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p class="text-xl font-bold text-white">Instagram Reel</p>
              <p class="text-gray-300 mt-2">Direct embedding disabled by Instagram</p>
              <a href="${url}" target="_blank" rel="noopener noreferrer" class="mt-6 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-full transition shadow-lg">
                View on Instagram →
              </a>
            </div>
          </div>
        `);
        return;
      }

      // REGULAR POSTS → iframe embed
      let embedUrl = cleanUrl;
      if (!embedUrl.endsWith('/embed')) embedUrl += '/embed/';

      setEmbedHtml(`
        <div class="my-12 flex justify-center">
          <iframe
            src="${embedUrl}"
            class="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0 shadow-2xl"
            frameborder="0"
            scrolling="no"
            allowtransparency="true"
            loading="lazy">
          </iframe>
        </div>
        <p class="text-center -mt-6">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-pink-400 underline text-sm">
            View on Instagram ↗
          </a>
        </p>
      `);
      return;
    }

        // ───── TikTok – 100% WORKING in Bolt.new v2 (iframe with player endpoint) ─────
    if (url.includes('tiktok.com')) {
      const cleanUrl = url.split('?')[0].replace(/\/$/, '');

      // Extract video ID from /video/ID
      const videoIdMatch = cleanUrl.match(/\/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      if (videoId) {
        setEmbedHtml(`
          <div class="my-12 flex justify-center">
            <iframe
              src="https://www.tiktok.com/player/v2/${videoId}?autoplay=0&muted=0"
              class="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0 shadow-2xl"
              scrolling="no"
              allowFullScreen
              allow="encrypted-media; fullscreen; picture-in-picture">
            </iframe>
          </div>
          <p class="text-center -mt-6">
            <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-400 underline text-sm">
              View on TikTok →
            </a>
          </p>
        `);
      } else {
        setEmbedHtml(`
          <p class="text-center my-12 text-gray-400">
            <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-400 underline">
              View on TikTok
            </a>
          </p>
        `);
      }
      return;
    }

    // ───── YouTube (Regular + Shorts) ─────
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        setEmbedHtml(`
          <div class="my-8 aspect-w-16 aspect-h-9">
            <iframe
              src="https://www.youtube.com/embed/${videoId}?rel=0"
              class="w-full h-96 rounded-lg border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
          </div>
        `);
      }
      return;
    }

    // Fallback for anything else
    setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${url}</a>`);
  }, [url]);

  // Fix Twitter rendering on first load
  useEffect(() => {
    if (embedHtml && (window as any).twttr?.widgets?.load) {
      (window as any).twttr.widgets.load();
    }
  }, [embedHtml]);

  if (!embedHtml) {
    return <p className="text-gray-500 my-8">Loading embed...</p>;
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: embedHtml }} className="[&_.twitter-tweet]:mx-auto" />
  );
}