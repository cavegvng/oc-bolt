import { useEffect, useRef, useState } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twitterHtml, setTwitterHtml] = useState<string | null>(null);

  const isTwitter = url.includes('x.com') || url.includes('twitter.com');
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isTikTok = url.includes('tiktok.com');

  useEffect(() => {
    if (!ref.current) return;

    if (isTwitter) {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&dnt=true`, {
        signal: controller.signal
      })
        .then(r => {
          clearTimeout(timeoutId);
          if (!r.ok) throw new Error('Twitter API error');
          return r.json();
        })
        .then(data => {
          if (data?.html && ref.current) {
            setTwitterHtml(data.html);
            ref.current.innerHTML = data.html;

            if (!scriptLoadedRef.current && !document.getElementById('twitter-script')) {
              const script = document.createElement('script');
              script.id = 'twitter-script';
              script.src = 'https://platform.twitter.com/widgets.js';
              script.async = true;
              document.body.appendChild(script);
              scriptLoadedRef.current = true;
            } else if ((window as any).twttr?.widgets?.load) {
              (window as any).twttr.widgets.load(ref.current);
            }
          }
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error('Twitter embed error:', err);
          setError(err.name === 'AbortError' ? 'Tweet took too long to load' : 'Failed to load tweet');
          setLoading(false);
        });
      return;
    }

    if (isInstagram) {
      let embedUrl = url.split('?')[0].replace(/\/$/, '');
      embedUrl = embedUrl.replace('/reel/', '/p/');
      if (!embedUrl.endsWith('/embed')) embedUrl += '/embed/';

      ref.current.innerHTML = `
        <div class="my-8 flex justify-center">
          <iframe src="${embedUrl}" class="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0 shadow-2xl"
            frameborder="0" scrolling="no" allowtransparency="true" loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups" referrerpolicy="no-referrer"></iframe>
        </div>
        <p class="text-center -mt-4">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-pink-500 hover:text-pink-600 underline text-sm font-medium">
            View on Instagram ↗
          </a>
        </p>
      `;
      return;
    }

    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        ref.current.innerHTML = `
          <div class="my-8 flex justify-center">
            <div class="w-full max-w-2xl">
              <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0"
                class="w-full h-96 rounded-lg border-0 shadow-2xl"
                allowfullscreen loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                referrerpolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
          </div>
        `;
      }
      return;
    }

    if (isTikTok) {
      ref.current.innerHTML = `
        <div class="my-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <p class="text-muted-foreground mb-2">TikTok embeds are currently unavailable</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer"
            class="text-blue-500 hover:text-blue-600 underline font-medium">
            View on TikTok ↗
          </a>
        </div>
      `;
      return;
    }

    ref.current.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline">${url}</a>`;
  }, [url, isTwitter, isInstagram, isYouTube, isTikTok]);

  if (loading) {
    return (
      <div className="my-8 flex justify-center">
        <div className="w-full max-w-lg h-96 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading embed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 flex justify-center">
        <div className="w-full max-w-lg p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
          <p className="text-red-700 dark:text-red-400 font-medium mb-2">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 underline font-medium"
          >
            View on Twitter/X ↗
          </a>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="my-4" />;
}
