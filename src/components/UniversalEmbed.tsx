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
if (url.includes('instagram.com') || url.includes('instagr.am')) {
      let embedUrl = url.split('?')[0].replace(/\/$/, '');

      embedUrl = embedUrl.replace('/reel/', '/p/');
      if (!embedUrl.endsWith('/embed')) embedUrl += '/embed/';

      const uniqueId = `ig-${Date.now()}`;

      setEmbedHtml(`
        <div class="my-8 flex justify-center">
          <div id="${uniqueId}" class="w-full max-w-lg relative rounded-lg overflow-hidden shadow-2xl bg-gray-900">
            <!-- Permanent beautiful fallback (always visible until iframe proves it works) -->
            <div id="${uniqueId}-fallback" class="w-full h-96 md:h-[680px] bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-lg flex flex-col items-center justify-center text-center p-8">
              <div class="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg class="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p class="text-lg text-gray-300">Loading Instagram content...</p>
            </div>

            <!-- iframe hidden behind fallback – only shown if it actually loads -->
            <iframe
              src="${embedUrl}"
              class="absolute inset-0 w-full h-full rounded-lg opacity-0 transition-opacity duration-500"
              frameborder="0"
              scrolling="no"
              allowtransparency="true"
              loading="lazy"
              onload="this.style.opacity='1'; document.getElementById('${uniqueId}-fallback').style.display='none';"
              onerror="document.getElementById('${uniqueId}-fallback').innerHTML = '<div class=\\"w-full h-full flex flex-col items-center justify-center text-center p-8\\"><svg class=\\"w-24 h-24 text-pink-400 mb-6\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\"><path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"1.5\\" d=\\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\"></path></svg><p class=\\"text-2xl font-bold text-white\\">Instagram Reel</p><p class=\\"text-gray-300 mt-2\\">Embedding blocked by Instagram</p><a href=\\"${url}\\" target=\\"_blank\\" class=\\"mt-8 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-full transition shadow-lg\\">View on Instagram ↗</a></div>'; this.style.display='none';">
            </iframe>
          </div>
        </div>
        <p class="text-center -mt-4">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-pink-400 underline text-sm">
            View on Instagram ↗
          </a>
        </p>
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