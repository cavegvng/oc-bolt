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

// ───── Instagram Posts & Reels – with nice fallback for blocked reels - Iframe Method ─────
    // ───── Instagram – Beautiful fallback, no white box of death ─────
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      let embedUrl = url.split('?')[0].replace(/\/$/, '');

      // Force /p/ for reels so embed works when possible
      embedUrl = embedUrl.replace('/reel/', '/p/');

      if (!embedUrl.endsWith('/embed')) {
        embedUrl += '/embed/';
      }

      setEmbedHtml(`
        <div class="my-8 flex justify-center relative">
          <iframe
            src="${embedUrl}"
            class="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0 shadow-2xl"
            frameborder="0"
            scrolling="no"
            allowtransparency="true"
            loading="lazy"
            onload="this.style.opacity=1"
            style="opacity:0; transition:opacity 0.4s"
            onerror="this.style.display='none'; this.parentElement.innerHTML = '<div class=\\"w-full max-w-lg h-96 md:h-[680px] bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-lg flex flex-col items-center justify-center text-center p-8 shadow-2xl\\"><svg class=\\"w-20 h-20 text-pink-400 mb-4\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\"><path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"1.5\\" d=\\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\"></path></svg><p class=\\"text-lg font-medium text-white\\">Instagram Reel</p><p class=\\"text-sm text-gray-300 mt-1\\">Embedding blocked by Instagram</p><a href=\\"${url}\\" target=\\"_blank\\" class=\\"mt-6 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-full transition\\">View on Instagram ↗</a></div>'">
          </iframe>
        </div>
      `);
      return;
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