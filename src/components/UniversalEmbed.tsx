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
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      let embedUrl = url.split('?')[0].replace(/\/$/, ''); // clean URL

      // Force /p/ for reels so embed works when possible
      embedUrl = embedUrl.replace('/reel/', '/p/');

      // Add /embed/ for the iframe
      if (!embedUrl.endsWith('/embed')) {
        embedUrl += '/embed/';
      }

      setEmbedHtml(`
        <div class="my-8 flex justify-center">
          <iframe
            src="${embedUrl}"
            class="w-full max-w-lg h-96 md:h-[680px] rounded-lg border-0"
            frameborder="0"
            scrolling="no"
            allowtransparency="true"
            loading="lazy"
            onerror="this.style.display='none'; this.parentElement.innerHTML+='<div class=\\"bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl w-full h-96 flex flex-col items-center justify-center text-gray-400\\"><svg class=\\"w-16 h-16 mb-4\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\"><path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"2\\" d=\\"M7 4v16M17 4v16M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z\\"></path></svg>Reel blocked by Instagram<br/><a href=\\"${url}\\" target=\\"_blank\\" class=\\"text-pink-400 underline mt-2\\">View on Instagram ↗</a></div>'">
          </iframe>
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