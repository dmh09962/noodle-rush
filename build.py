import base64
logo = base64.b64encode(open('logo.jpg','rb').read()).decode()
js = '\n'.join(open('src/'+f).read() for f in ['data.js','art.js','game.js','shop.js'])
open('bundle.js','w').write(js)
FS_JS = r'''// On phones, ask for full screen on the first tap (Android and iPad allow it; iPhone uses Add to Home Screen instead).
(function () {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const go = () => {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
      try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {}
    }
  };
  document.addEventListener('pointerup', go, { once: true });
})();
'''
html = f'''<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Noodle Rush</title>
<meta name="theme-color" content="#07411e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Noodle Rush">
<!--WEBAPP-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@700;800&family=Patrick+Hand&display=swap">
<style>
/* Layout: one full-window game canvas, letterboxed on basil green. Single dark look by design. */
:root {{ --basil: #07411e; --pasta: #f6c453; --cream: #fbf3e0; --ink: #2b1a10; --tomato: #d9432f; color-scheme: dark; }}
html, body {{ height: 100%; margin: 0; }}
body {{ background: var(--basil); color: var(--cream); overflow: hidden; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }}
#game {{ position: fixed; inset: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); touch-action: none; }}
#game canvas {{ display: block; touch-action: none; }}
/* phones held upright: ask for landscape */
#rotate {{ display: none; position: fixed; inset: 0; z-index: 20; background: var(--basil); color: var(--cream); font: 800 22px/1.4 Nunito, sans-serif; text-align: center; align-items: center; justify-content: center; flex-direction: column; gap: 18px; padding: 24px; }}
#rotate .phone {{ width: 46px; height: 78px; border: 5px solid var(--pasta); border-radius: 10px; animation: turn 1.8s ease-in-out infinite; }}
@keyframes turn {{ 0%, 30% {{ transform: rotate(0); }} 60%, 100% {{ transform: rotate(-90deg); }} }}
@media (orientation: portrait) and (pointer: coarse) {{ #rotate {{ display: flex; }} }}
/* tester feedback card */
#nr-feedback {{ position: fixed; inset: 0; z-index: 30; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; padding: 12px; -webkit-user-select: text; user-select: text; }}
#nr-feedback .fb-card {{ background: #fffaee; color: var(--ink); border: 4px solid var(--ink); border-radius: 20px; padding: 18px 22px; width: min(560px, 100%); max-height: 100%; overflow: auto; box-sizing: border-box; font: 700 16px/1.35 Nunito, sans-serif; }}
#nr-feedback h2 {{ margin: 0 0 4px; font: 800 28px/1.1 "Baloo 2", sans-serif; color: #b8322a; }}
#nr-feedback .fb-sub {{ margin: 0 0 10px; color: #7d4a26; font-size: 15px; }}
#nr-feedback .fb-q {{ display: block; margin: 10px 0 4px; font-weight: 800; }}
#nr-feedback .fb-row {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }}
#nr-feedback button {{ font: 800 17px "Baloo 2", sans-serif; border: 3px solid var(--ink); border-radius: 12px; background: #f1e6cc; color: var(--ink); min-width: 48px; min-height: 44px; padding: 0 14px; cursor: pointer; }}
#nr-feedback button.on {{ background: var(--pasta); box-shadow: 0 0 0 3px #f2b630; }}
#nr-feedback .fb-hint {{ font-size: 13px; color: #7d4a26; }}
#nr-feedback textarea {{ width: 100%; box-sizing: border-box; border: 2px solid #c9b48a; border-radius: 10px; padding: 8px; font: 700 16px Nunito, sans-serif; color: var(--ink); background: #fff; resize: vertical; }}
#nr-feedback #fb-out {{ margin-top: 10px; font-size: 13px; background: #f4efe2; }}
#nr-feedback .fb-actions {{ display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }}
#nr-feedback .fb-copy {{ background: var(--tomato); color: #fff8e8; }}
#nr-feedback .fb-share {{ background: #2f5ea8; color: #fff8e8; }}
#nr-feedback .fb-done {{ margin: 8px 0 0; color: #1f6b3b; min-height: 1em; }}
@media (max-height: 500px) {{
  #nr-feedback .fb-card {{ padding: 10px 16px; font-size: 14px; border-radius: 14px; }}
  #nr-feedback h2 {{ font-size: 21px; }}
  #nr-feedback .fb-sub {{ font-size: 13px; margin-bottom: 4px; }}
  #nr-feedback .fb-q {{ margin: 6px 0 3px; }}
  #nr-feedback button {{ min-height: 36px; min-width: 40px; font-size: 15px; }}
  #nr-feedback textarea {{ font-size: 14px; padding: 5px 8px; }}
}}
</style>
<div id="game" aria-label="Noodle Rush game"></div>
<div id="rotate" role="status"><div class="phone"></div>Turn your phone sideways to play Noodle Rush</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js"></script>
<script>
{FS_JS}</script>
<script>window.NOODLE_LOGO = "data:image/jpeg;base64,{logo}";</script>
<script>
{js}
</script>
'''
import os, shutil
open('index.html','w').write(html.replace('<!--WEBAPP-->', '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">\n<link rel="icon" href="icon-192.png">'))
open('manifest.webmanifest','w').write('{"name":"Noodle Rush","short_name":"Noodle Rush","start_url":"./","display":"fullscreen","orientation":"landscape","background_color":"#07411e","theme_color":"#07411e","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"}]}')
print(len(html))
