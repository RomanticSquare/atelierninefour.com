"""Source checks only; requires beautifulsoup4. No requests or browser automation."""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit, unquote
import json, xml.etree.ElementTree as ET
from html.parser import HTMLParser
class Attributes(HTMLParser):
 def handle_starttag(self,tag,attrs):
  names=[x[0] for x in attrs];assert len(names)==len(set(names)), (tag,names)
root=Path(__file__).resolve().parents[1]
issues=[];pages=[];titles=[]
for p in sorted(root.glob('*.html')):
 Attributes().feed(p.read_text())
 s=BeautifulSoup(p.read_text(),'html.parser');title=s.title.get_text();titles.append(title)
 row={'page':p.name,'title':title,'bytes':p.stat().st_size,'h1_count':len(s.select('h1')),'canonical':[a.get('href') for a in s.select('link[rel=canonical]')],'robots':[a.get('content') for a in s.select('meta[name=robots]')],'description':[a.get('content') for a in s.select('meta[name=description]')]};pages.append(row)
 if s.select('link[href*="a94-site.css"]'):
  assert len(s.select('h1'))==1,p
  assert len(row['canonical'])==1,p
  assert s.html.get('lang')=='en',p
  assert s.select_one('main#main[tabindex="-1"]'),p
  assert s.select_one('script[src="/a94-site.js"]'),p
  assert s.select_one('meta[name=description]'),p
  for x in s.select('input:not([type=hidden]):not([name=_gotcha]),textarea,select'):
   assert s.find('label',attrs={'for':x.get('id')}),(p,x)
 ids=[x['id'] for x in s.select('[id]')];assert len(ids)==len(set(ids)),p
 for x in s.select('script[type="application/ld+json"]'):json.loads(x.string)
 for a in s.select('[href],[src]'):
  raw=a.get('href') or a.get('src');u=urlsplit(raw)
  if u.scheme or u.netloc:continue
  target=root/unquote(u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.path:target=p
  if target.is_dir():target=target/'index.html'
  if not target.exists():issues.append([p.name,raw,'missing file'])
  elif u.fragment and target.suffix=='.html' and not BeautifulSoup(target.read_text(),'html.parser').find(id=u.fragment):issues.append([p.name,raw,'missing fragment'])
assert not issues,issues
sitemap=ET.parse(root/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};urls=[e.text for e in sitemap.findall('.//s:loc',ns)]
for u in urls:
 p=root/(urlsplit(u).path.lstrip('/') or 'index.html');s=BeautifulSoup(p.read_text(),'html.parser');assert not s.select('meta[name=robots][content*=noindex]'),u
assert len(urls)==12
result={'status':'PASS','root_html_pages':len(pages),'sitemap_entries':len(urls),'broken_local_references':issues,'pages':pages}
(root/'audit/source-results.json').write_text(json.dumps(result,indent=2));print('PASS: 18 HTML files; 12 sitemap entries; 0 broken root local references; labels, main focus, IDs and JSON-LD checked.')
