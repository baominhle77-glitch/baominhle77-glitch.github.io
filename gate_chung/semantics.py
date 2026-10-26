"""Shared language roles: measurements/context/verbs are not image objects.
No episode identifiers or subject-specific object names are allowed here.
"""
import re
CONTEXT_WORDS={'lab','laboratory','study','studies','research','researcher','report','reported','calculated','calculation','episode','chapter','example'}
TIME_WORDS={'second','seconds','minute','minutes','hour','hours','day','days','month','months','year','years','century','centuries'}
SI_BASES={'metre','meter','newton','joule','watt','pascal','kelvin','ampere','volt','ohm','hertz','tesla','gram','mole','molar','litre','liter','coulomb','farad','henry','siemens','weber','radian','steradian','becquerel','gray','sievert','katal','degree','percent','percentage'}
PREFIXES=('deca','hecto','kilo','mega','giga','tera','peta','deci','centi','milli','micro','nano','pico','femto','atto')
FUNCTIONS={'point','points'}
def unit(word):
 w=word.lower().rstrip('s')
 return w in SI_BASES or any(w.startswith(p) and w[len(p):] in SI_BASES for p in PREFIXES)
def role(word):
 w=word.lower()
 if w in CONTEXT_WORDS:return 'context'
 if unit(w) or w in TIME_WORDS or w in FUNCTIONS or re.fullmatch(r'[A-Z]{2,6}',word):return 'data'
 return 'object'
def screen_data(text):
 # SI typography is expanded for speech/display matching, across all genres.
 text=text.replace('mN/m',' millinewtons per metre ').replace('m/s',' metre per second ').replace('mM',' millimolar ')
 return text.lower()
