"""Expand the bundled English catalogue from a local TCGdex/cards-database checkout.
Usage: python scripts/expand-catalogue.py ../tcgdex-reference
Existing card records are preserved verbatim so saved collections remain compatible.
"""
import json, re, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1] if len(sys.argv) > 1 else '../tcgdex-reference') / 'data'
path = root / 'src/game/catalogue.json'
existing = json.loads(path.read_text())
old = {s['id']: s for s in existing}
# The numbered English expansion runs, including the early promo set containing Mew.
groups = [('Kanto', ['Base','Gym']), ('Johto',['Neo','HeartGold & SoulSilver']), ('Hoenn',['EX']), ('Sinnoh',['Diamond & Pearl','Platinum']), ('Unova',['Black & White']), ('Kalos',['XY']), ('Alola',['Sun & Moon']), ('Galar',['Sword & Shield']), ('Paldea',['Scarlet & Violet'])]
patterns = {'Kanto':r'base[1-5]|basep|gym[12]', 'Johto':r'neo[1-4]|hgss[1-4]', 'Hoenn':r'ex\d+', 'Sinnoh':r'dp[1-7]|pl[1-4]', 'Unova':r'bw\d+', 'Kalos':r'xy\d+|g1', 'Alola':r'sm\d+(?:\.\d+)?|sma|det1', 'Galar':r'swsh\d+(?:\.\d+)?(?:tg|gg|sv)?|cel25(?:cc)?', 'Paldea':r'sv\d+(?:\.\d+[bw]?)?'}
def field(text, key):
    match = re.search(r'\b'+key+r'\s*:\s*([\"\'])(.*?)\1', text, re.S)
    return match.group(2) if match else ''
def english(text):
    match = re.search(r'\bname\s*:\s*\{(.*?)\}', text, re.S)
    return field(match.group(1), 'en') if match else ''
def tier(rarity, holo):
    r = rarity.lower()
    if r == 'common': return 0
    if r == 'uncommon': return 1
    if 'hyper' in r: return 6
    if 'secret' in r or 'special illustration' in r or 'black white' in r: return 5
    if any(x in r for x in ['ultra', 'illustration', 'double', ' vmax', ' vstar', 'rare v', 'legend', 'prime', 'full art', 'shiny', 'radiant', 'ace spec']): return 4
    return 3 if holo or 'holo' in r else 2
result=[]
dex_by_era={}
for era, series_list in groups:
    candidates=[]
    for series in series_list:
        for set_file in (source / series).glob('*.ts'):
            text=set_file.read_text(); set_id=field(text,'id')
            if not re.fullmatch(patterns[era],set_id): continue
            folder=set_file.with_suffix('')
            if not folder.is_dir(): continue
            candidates.append((field(text,'releaseDate'),set_id,english(text),series,folder))
    candidates.sort(key=lambda x:(x[0],x[1]))
    dex=set()
    for release,set_id,name,series,folder in candidates:
        cards=[]
        serie_id=field((source / (series+'.ts')).read_text(),'id')
        for file in sorted(folder.glob('*.ts'),key=lambda p:(int(p.stem) if p.stem.isdigit() else 9999,p.stem)):
            text=file.read_text(); name_card=english(text)
            if not name_card: continue
            rarity=field(text,'rarity')
            if not rarity: continue
            holo=bool(re.search(r'\btype:\s*[\"\']holo[\"\']',text))
            types=re.search(r'\btypes\s*:\s*\[\s*[\"\']([^\"\']+)',text)
            dex_match=re.search(r'\bdexId\s*:\s*\[([^\]]*)\]',text,re.S)
            if dex_match: dex.update(map(int,re.findall(r'\d+',dex_match.group(1))))
            local=file.stem; id_=set_id+'-'+local
            cards.append(dict(id=id_,localId=local,name=name_card,image=f'https://assets.tcgdex.net/en/{serie_id}/{set_id}/{local}',setId=set_id,rarity=rarity,tier=tier(rarity,holo),type=types.group(1) if types else field(text,'category'),holo=holo))
        if not cards or not any(c['tier']>=2 for c in cards): continue
        if set_id in old:
            entry=old[set_id]
        else:
            template=next(s for s in existing if s['era']==era)
            hero=max(cards,key=lambda c:c['tier'])['id']
            entry=dict(id=set_id,name=name,era=era,title=name.upper(),price=template['price'],color=template['color'],releaseDate=release,logo=f'https://assets.tcgdex.net/en/{serie_id}/{set_id}/logo',hero=hero,total=len(cards),cards=cards)
        result.append(entry)
    dex_by_era[era]=dex
# Ensure the saved records from the original nine sets are untouched.
assert all(next(s for s in result if s['id']==x['id'])==x for x in existing)
assert set(range(1,152)).issubset(dex_by_era['Kanto']), sorted(set(range(1,152))-dex_by_era['Kanto'])
ids=[c['id'] for s in result for c in s['cards']]
assert len(ids)==len(set(ids))
path.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(result)} real expansions; {len(ids)} cards; all 151 Kanto species verified from source dexId metadata.')
for era,_ in groups: print(era, len([s for s in result if s['era']==era]),'sets')
