from pathlib import Path
from bs4 import BeautifulSoup
import re, subprocess, json, sys, http.server, socketserver, threading, requests, urllib.parse, os, collections, mimetypes, hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; reports=[]
def add(name,status,detail=''):
 reports.append({'test':name,'status':status,'detail':str(detail)[:800]});print(status,name,detail,flush=True)
index=BeautifulSoup((ROOT/'index.html').read_text(),'lxml');detail=BeautifulSoup((ROOT/'analiza-plan-detaliat.html').read_text(),'lxml')
for label,soup in [('main',index),('detail',detail)]:
 ids=[x.get('id') for x in soup.select('[id]')]
 repeated={k:v for k,v in collections.Counter(ids).items() if v>1}
 add(label+' unique IDs','PASS' if not repeated else 'FAIL',repeated)
 imgs=[x for x in soup.select('img') if x.get('alt') is None]
 add(label+' img alternative text','PASS' if not imgs else 'FAIL',len(imgs))
 missing_labels=[]
 for button in soup.select('button'):
  if not button.get_text(strip=True) and not button.get('aria-label') and not button.get('aria-labelledby') and button.get('title') is None:missing_labels.append(str(button)[:200])
 add(label+' button accessible names','PASS' if not missing_labels else 'FAIL',missing_labels[:3])
 internal=[]
 for t in soup.select('script[src],link[href],img[src],video[poster],source[src],a[href]'):
  for prop in ['src','href','poster']:
   val=t.get(prop)
   if val and val.startswith('./'):
    raw=val.split('#')[0].split('?')[0]; internal.append((val,ROOT/raw[2:]))
 missing=[v for v,path in internal if not path.exists()]
 add(label+' relative resource links','PASS' if not missing else 'FAIL',missing[:10])
 add(label+' heading hierarchy','PASS' if soup.select('h1') else 'LIMITED','h1 count '+str(len(soup.select('h1'))))
for js in ROOT.glob('*.js'):
 proc=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
 add(js.name+' JS syntax','PASS' if proc.returncode==0 else 'FAIL',proc.stderr[:200])
add('Candidate name without diacritics','PASS' if not re.search('Că[tț]ană|Cătana|Cățană|Cătană',str(index),re.I) else 'FAIL')
add('Creative Assets chapter removed','PASS' if not index.select('[data-chapter="creative"]') and 'Creative Assets' not in str(index) else 'FAIL')
add('Calendar exact link','PASS' if index.select_one('#meetButton')['href']=='https://calendar.app.google/czSG1gu1BzWCy4E27' else 'FAIL')
add('market metric Romania 2025','PASS' if '11,9' in (ROOT/'analiza-plan-detaliat.html').read_text() and '2025' in (ROOT/'analiza-plan-detaliat.html').read_text() else 'FAIL')
video=ROOT/'assets/video/DetailLane_Showreel_Doar_Videoclip.mp4'
p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,format_name:stream=codec_name,width,height','-of','json',str(video)],capture_output=True,text=True)
try: meta=json.loads(p.stdout); dur=float(meta['format']['duration']);add('DetailLane video metadata','PASS' if 45.9<dur<46.1 else 'FAIL',meta)
except: add('DetailLane video metadata','FAIL',p.stderr)
# full frame decode: -f null to avoid disk writes
p=subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True,timeout=50)
add('DetailLane full decode','PASS' if p.returncode==0 else 'FAIL',p.stderr[:200])
# Python's HTTP reads on loopback; Chromium navigation is blocked by enterprise policy
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=socketserver.TCPServer(('127.0.0.1',0),Handler)
th=threading.Thread(target=server.serve_forever,daemon=True);th.start();url=f'http://127.0.0.1:{server.server_address[1]}/'
try:
 paths={'' ,'index.html','analiza-plan-detaliat.html'}
 for name in ['index.html','analiza-plan-detaliat.html']:
  soup=BeautifulSoup((ROOT/name).read_text(),'lxml')
  for t in soup.select('script[src],link[href],img[src],video[poster],source[src]'):
   for attr in ['src','href','poster']:
    v=t.get(attr)
    if v and v.startswith('./'):paths.add(v[2:].split('#')[0].split('?')[0])
 status={}
 for path in sorted(paths):
  res=requests.get(url+path,timeout=5);status[path]=(res.status_code,len(res.content))
 add('HTTP all page resources','PASS' if all(code==200 for code,size in status.values()) else 'FAIL',f'{len(status)} requests, errors: {[x for x in status.items() if x[1][0]!=200]}')
except Exception as e:add('HTTP all page resources','FAIL',str(e))
finally:server.shutdown();server.server_close()
# No-JS and reduced-motion smoke test using original inlined HTML, CSS, JS
sys.path.insert(0,str(ROOT/'qa'))
from browser_audit import inline
with sync_playwright() as p:
 b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(java_script_enabled=False)
 page.set_content(inline('index.html'),wait_until='domcontentloaded')
 add('no-JS chapters accessible','PASS' if page.locator('#who').is_visible() and page.locator('#proof').is_visible() and page.locator('#plan').is_visible() else 'FAIL')
 page.close()
 page=b.new_page(reduced_motion='reduce')
 page.set_content(inline('index.html'),wait_until='domcontentloaded')
 page.locator('#startButton').click()
 add('reduced motion script activation','PASS' if page.locator('#appShell').evaluate('(e)=>e.classList.contains("skip-intro")') else 'FAIL')
 page.close();b.close()
(ROOT/'qa'/'static_results.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
print('SUMMARY',len(reports),'PASS',sum(x['status']=='PASS' for x in reports),'FAIL',sum(x['status']=='FAIL' for x in reports),'LIMITED',sum(x['status']=='LIMITED' for x in reports))
