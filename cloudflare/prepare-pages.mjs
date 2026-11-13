import fs from 'node:fs';
fs.mkdirSync('pages-dist',{recursive:true});
for(const name of ['assets','fonts','marca','index.html','404.html','apple-touch-icon.png','favicon-96x96.png','favicon.ico','manifest.json','og.png','robots.txt','site.webmanifest','sitemap.xml','web-app-manifest-192x192.png','web-app-manifest-512x512.png','web-app-manifest-maskable-192x192.png','web-app-manifest-maskable-512x512.png','avilaops-indexnow-20260730.txt'])fs.cpSync(name,'pages-dist/'+name,{recursive:true});
