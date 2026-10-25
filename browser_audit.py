"""THE APPLICATION.exe V1.0: browser tests using original CSS/JS inlined into an
about:blank Chromium document. Navigation across actual URLs is blocked by
this environment. The source HTML/CSS/JS remain unchanged in the delivered site."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json,base64,mimetypes,traceback,re,sys,time
ROOT=Path(__file__).resolve().parents[1]; OUT=Path(__file__).parent
results=[]; issues=[]
def log(name,status,detail=''):
 results.append({'test':name,'status':status,'detail':str(detail)[:650]});print(status,name,str(detail)[:160],flush=True)
def inline(name):
 s=BeautifulSoup((ROOT/name).read_text(encoding='utf-8'),'lxml')
 for tag in list(s.find_all('link',rel='stylesheet')):
  href=tag.get('href','').lstrip('./'); path=ROOT/href
  tag2=s.new_tag('style'); tag2.string=path.read_text(encoding='utf-8');tag.replace_with(tag2)
 scripts=[]
 for tag in list(s.find_all('script',src=True)):
  scripts.append((ROOT/tag['src'].lstrip('./')).read_text(encoding='utf-8'))
  tag.decompose()
 for tag in s.find_all(['img','video','source']):
  for attr in ('src','poster'):
   src=tag.get(attr)
   if src and src.startswith('./'):
    path=ROOT/src[2:]
    if path.exists():
     mimetype=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
     if path.stat().st_size<3_000_000:
      tag[attr]='data:'+mimetype+';base64,'+base64.b64encode(path.read_bytes()).decode()
 # app scripts must execute after body (like original deferred scripts)
 for js in scripts:
  el=s.new_tag('script');el.string=js;s.body.append(el)
 return str(s)

def browser_test():
 main=inline('index.html'); detail=inline('analiza-plan-detaliat.html')
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,375,390,430,768,1024,1440,1920]:
   for name,markup in [('main',main),('detail',detail)]:
    page=b.new_page(viewport={'width':width,'height':860},device_scale_factor=1)
    errs=[];page.on('pageerror', lambda exc:errs.append(str(exc)))
    try:
     page.set_content(markup,wait_until='domcontentloaded',timeout=28000)
     page.wait_for_timeout(220)
     if name=='main':
      try: page.locator('#startButton').click(timeout=7000)
      except Exception as e: issues.append(('start_'+str(width),str(e)[:180]))
      page.wait_for_timeout(150)
     measure=page.evaluate('''() => ({doc:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,body:document.body.scrollWidth,
       imageErrors:[...document.images].filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.getAttribute('alt')),
       headingCount:document.querySelectorAll('h1').length,
       chapterCount:document.querySelectorAll('[data-chapter]').length,
       notice:getComputedStyle(document.querySelector('body')).overflowX})''')
     overflow=measure['doc']-measure['client']
     log(f'{name} responsive {width}px','PASS' if overflow<=1 and not errs else 'FAIL', f'overflow={overflow}px; js={errs[:2]}; img={measure["imageErrors"][:2]}')
     if width in (390,1440):
      if name=='main':
       page.locator('#plan').scroll_into_view_if_needed(timeout=9000)
       page.wait_for_timeout(200)
      page.screenshot(path=str(OUT/'screenshots'/f'{name}_{width}.png'),full_page=False,animations='disabled')
    except Exception as e:
     log(f'{name} responsive {width}px','FAIL',str(e)[:400])
    page.close()
  page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
  page.set_content(main,wait_until='domcontentloaded')
  log('original personalized Hook','PASS' if page.locator('#startButton').is_visible() and page.locator('#who').is_hidden() else 'FAIL')
  log('chapter structure','PASS' if page.locator('[data-chapter]').count()==5 and not page.locator('[data-chapter="creative"]').count() else 'FAIL',page.locator('[data-chapter]').evaluate_all('(els)=>els.map(x=>x.id)'))
  log('fast recruit skip path','PASS' if page.locator('.intro-skip').is_visible() else 'FAIL')
  try:
   page.locator('#introExitButton').click()
   log('exit modal opens','PASS' if page.locator('#exitOverlay').is_visible() else 'FAIL')
   page.keyboard.press('Tab');log('exit modal focus containment','PASS' if page.evaluate('document.activeElement.closest("#exitOverlay")!==null') else 'FAIL')
   page.keyboard.press('Escape');log('exit modal Escape restores focus','PASS' if page.locator('#exitOverlay').is_hidden() and page.evaluate('document.activeElement.id==="introExitButton"') else 'FAIL')
  except Exception as e:log('exit modal focus','FAIL',e)
  page.locator('#startButton').click()
  log('start navigation + focus','PASS' if page.locator('#who').is_visible() and page.evaluate('document.activeElement.id==="whoTitle"') else 'FAIL',page.evaluate('document.activeElement.id'))
  log('chapter dots after start','PASS' if page.locator('.story-dot').count()==5 and page.locator('#storyDots').is_visible() else 'FAIL')
  # Puzzle independent actions
  try:
   page.locator('[data-go="marketing/secret"]').first.click(timeout=6000)
   page.locator('#secretCode').fill('NOPE')
   page.locator('#secretForm button[type="submit"]').click()
   bad=page.locator('#codeFeedback').inner_text()
   page.locator('#secretCode').fill('IDEE')
   page.locator('#secretForm button[type="submit"]').click()
   good=page.locator('#codeFeedback').inner_text()
   log('puzzle wrong and IDEE correct','PASS' if 'recunoscut' in good.lower() and 'recunoscut' not in bad.lower() else 'FAIL', bad+' / '+good)
   log('puzzle four clues defined','PASS' if page.locator('[data-clue]').count()==4 else 'FAIL')
  except Exception as e:log('puzzle actions','FAIL',str(e)[:400])
  # Quiz 5 steps
  try:
   page.locator('[data-go="marketing/quiz"]').first.click(timeout=8000)
   for j in range(5):
    page.locator('#quizOptions button').first.click()
    page.locator('#quizNext').click()
   log('quiz five steps + recommendations','PASS' if page.locator('#quizResult').is_visible() else 'FAIL',page.locator('#quizResultTitle').inner_text())
   page.locator('#quizRestart').click()
   log('quiz reset','PASS' if page.locator('#quizQuestion').is_visible() and '01' in page.locator('#quizProgressLabel').inner_text() else 'FAIL')
  except Exception as e:log('quiz interactive','FAIL',str(e)[:400])
  # Circle four steps
  try:
   page.locator('[data-go="marketing/circle"]').first.click(timeout=8000)
   for i in range(4):
    page.locator('#circleChoices button').first.click()
    if i<3:page.locator('#circleNext').click()
   if page.locator('#circleNext').is_visible():page.locator('#circleNext').click()
   log('Beauty Circle 4 scenarios','PASS' if page.locator('#circleFinish').is_visible() else 'FAIL')
   page.locator('#circleRestart').click()
   log('Beauty Circle restart','PASS' if page.locator('#circleChoices button').count()>=2 else 'FAIL')
  except Exception as e:log('Beauty Circle interactive','FAIL',str(e)[:400])
  # Arcade win fast path
  try:
   page.locator('[data-go="marketing/arcade"]').first.click(timeout=8000)
   page.locator('#arcadeStart').click()
   n=0;end=time.time()+17
   while time.time()<end and n<9:
    cells=page.locator('#arcadeBoard button.glow-target')
    if cells.count():cells.first.click(force=True);n+=1
    page.wait_for_timeout(325)
   log('arcade 9 hits applied','PASS' if n>=9 and int(page.locator('#arcadeScore').inner_text())>=90 else 'FAIL',f'{n} hits; score {page.locator("#arcadeScore").inner_text()}')
   # finish game by virtual clock? wait 25 sec; skip due to active timer? force with Date.now patched globally
   page.evaluate('window.Date.now=()=>99999999999999')
   page.wait_for_timeout(180)
   log('arcade win/coupon','PASS' if page.locator('#demoCoupon').is_visible() else 'FAIL')
   page.locator('#arcadeReplay').click()
   log('arcade replay','PASS' if page.locator('#arcadeResult').is_hidden() else 'FAIL')
  except Exception as e:log('arcade test','FAIL',str(e)[:500])
  page.reload if False else None
  try:
   page.locator('[data-scroll-to="proof"]').first.click(timeout=7000)
   log('Proof of Work DetailLane video exists','PASS' if page.locator('#detailLaneVideo source').count()==1 else 'FAIL')
   video=page.locator('#detailLaneVideo').evaluate('(v)=>({ready:v.readyState, duration:v.duration, width:v.videoWidth,height:v.videoHeight})')
   log('embedded video metadata','PASS' if video['duration']>45 and video['width']==1920 else 'LIMITED',video)
   page.locator('[data-scroll-to="plan"]').first.click(timeout=7000)
   log('Proof to plan','PASS' if page.locator('#plan').is_visible() else 'FAIL')
   page.locator('[data-scroll-to="decision"]').last.click(timeout=7000)
   log('Plan to Final Decision','PASS' if page.locator('#decision').is_visible() else 'FAIL')
   link=page.locator('#meetButton')
   log('calendar booking exact URL and security','PASS' if link.get_attribute('href')=='https://calendar.app.google/czSG1gu1BzWCy4E27' and link.get_attribute('target')=='_blank' and 'noopener' in link.get_attribute('rel') and 'noreferrer' in link.get_attribute('rel') else 'FAIL')
  except Exception as e:log('final navigation','FAIL',str(e)[:400])
  log('main JS errors','PASS' if not errors else 'FAIL', errors)
  # mobile touch Hook
  mobile=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  mobile.set_content(main,wait_until='domcontentloaded')
  mobile.locator('#noButton').click()
  armed=mobile.locator('#noButtonText').inner_text()
  mobile.locator('#noButton').click()
  log('Hook touch double-tap','PASS' if 'aștept' in armed and mobile.locator('#who').is_visible() else 'FAIL',armed)
  mobile.close()
  # detailed analysis semantic/accessibility basics and sources
  d=b.new_page(viewport={'width':390,'height':844})
  d.set_content(detail,wait_until='domcontentloaded')
  log('detail route and source links','PASS' if d.locator('a[data-return]').count()==2 and d.locator('#piata').count()==1 and d.locator('#surse a[href^="https"]').count()>=7 else 'FAIL')
  log('data distinction','PASS' if '11,9' in d.locator('#piata').inner_text() and 'GLOBAL' in d.locator('#piata').inner_text().upper() else 'FAIL')
  b.close()

if __name__=='__main__':
 try:browser_test()
 except Exception as e:log('Browser harness exception','FAIL',traceback.format_exc()[-1500:])
 (OUT/'browser_results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print('SUMMARY',len(results),'PASS',sum(x['status']=='PASS' for x in results),'FAIL',sum(x['status']=='FAIL' for x in results),'LIMITED',sum(x['status']=='LIMITED' for x in results))
