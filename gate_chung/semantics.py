"""Shared language roles: measurements/context/verbs are not image objects.
No episode identifiers or subject-specific object names are allowed here.
"""
import re
CONTEXT_WORDS={'lab','laboratory','study','studies','research','researcher','report','reported','calculated','calculation','episode','chapter','example'}
TIME_WORDS={'second','seconds','minute','minutes','hour','hours','day','days','month','months','year','years','century','centuries'}
SI_BASES={'metre','meter','newton','joule','watt','pascal','kelvin','ampere','volt','ohm','hertz','tesla','gram','mole','molar','litre','liter','coulomb','farad','henry','siemens','weber','radian','steradian','becquerel','gray','sievert','katal','degree','percent','percentage','cent'}
PREFIXES=('deca','hecto','kilo','mega','giga','tera','peta','deci','centi','milli','micro','nano','pico','femto','atto')
FUNCTIONS={'point','points'}
SMALL_NUMBERS=('zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen')
TENS=('','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety')
NUMBER_WORDS=set(SMALL_NUMBERS)|set(TENS[2:])|{'hundred','thousand','million','billion','trillion'}
def unit(word):
 w=word.lower().rstrip('s')
 return w in SI_BASES or w in {'megohm','kilohm'} or any(w.startswith(p) and w[len(p):] in SI_BASES for p in PREFIXES)
def role(word):
 w=word.lower()
 if w in CONTEXT_WORDS:return 'context'
 if unit(w) or w in TIME_WORDS or w in FUNCTIONS|NUMBER_WORDS or re.fullmatch(r'\d+(?:\.\d+)?',w) or re.fullmatch(r'[A-Z]{2,6}',word):return 'data'
 return 'object'
def spoken_integer(n):
 if n<20:return SMALL_NUMBERS[n]
 if n<100:return TENS[n//10]+(' '+SMALL_NUMBERS[n%10] if n%10 else '')
 if n<1000:return SMALL_NUMBERS[n//100]+' hundred'+(' '+spoken_integer(n%100) if n%100 else '')
 for magnitude,name in ((10**12,'trillion'),(10**9,'billion'),(10**6,'million'),(1000,'thousand')):
  if n>=magnitude:return spoken_integer(n//magnitude)+' '+name+(' '+spoken_integer(n%magnitude) if n%magnitude else '')
def screen_data(text):
 # SI typography is expanded for speech/display matching, across all genres.
 text=text.replace('mN/m',' millinewtons per metre ').replace('m/s',' metre per second ').replace('mM',' millimolar ')
 # Numeric typography and spoken cardinal/decimal words have the same role.
 # Keep digits too, so literal years and unit symbols remain verifiable.
 def expand(match):
  whole,point,fraction=match.group().partition('.')
  return spoken_integer(int(whole))+(' point '+' '.join(SMALL_NUMBERS[int(c)] for c in fraction) if point else '')
 return text.lower()+' '+re.sub(r'\d+(?:\.\d+)?',expand,text.lower())
