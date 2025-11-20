import { useEffect, useState } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState('');

  useEffect(() => {
    if (!url) return;

    // ───── X / Twitter (still perfect with oEmbed) ─────
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

    // ───── Instagram – Clean white-box killer + beautiful fallback ─────
// ───── Instagram – No white box, React detection for blocked embeds ─────
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      let embedUrl = url.split('?')[0].replace(/\/$/, '');

      embedUrl = embedUrl.replace('/reel/', '/p/');
      if (!embedUrl.endsWith('/embed')) embedUrl += '/embed/';

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const iframeRef = useRef<HTMLIFrameElement>(null);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [showFallback, setShowFallback] = useState(false);

      useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const checkBlocked = () => {
          try {
            // If we can access contentDocument and it's empty or blocked
            if (iframe.contentWindow?.location.href === 'about:blank' || !iframe.contentDocument?.body?.childElementCount) {
              setShowFallback(true);
            }
          } catch (e) {
            // Cross-origin error = blocked by X-Frame-Options
            setShowFallback(true);
          }
        };

        iframe.onload = checkBlocked;
        // Also check after a delay in case onload doesn't fire properly
        const timeout = setTimeout(checkBlocked, 2000);

        return () => clearTimeout(timeout);
      }, [embedUrl]);

      if (showFallback) {
        return (
          <div className="my-8 flex justify-center">
            <div className="w-full max-w-lg h-96 md:h-[680px] bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-lg flex flex-col items-center justify-center text-center p-8 shadow-2xl">
              <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-xl font-bold text-white">Instagram Reel</p>
              <p className="text-gray-300 mt-2">Embedding blocked by Instagram</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="mt-6 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-full transition shadow-lg">
                View on Instagram →
              </a>
            </div>
          </div>
        );
      }

      return (
        <div className="my-8 flex justify-center">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0"
            frameBorder="0"
            scrolling="no"
            allowTransparency
          />
        </div>
      );
    }

    // ───── YouTube ─────
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
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

    // Fallback
    setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${url}</a>`);

  }, [url]);

  // Fix Twitter rendering on first load
  useEffect(() => {
    if (embedHtml && (window as any).twttr?.widgets?.load) {
      (window as any).twttr.widgets.load();
    }
  }, [embedHtml]);

  if (!embedHtml) return <p className="text-gray-500 my-8">Loading embed...</p>;

  return <div dangerouslySetInnerHTML={{ __html: embedHtml }} className="[&_.twitter-tweet]:mx-auto" />;
}