"""Language analysis is shared. Visual nouns are bound by the episode registry."""
import re,os
from .model import norm
from .semantics import role
from .policy import BAD_END_EN,BAD_END_VI,GRAPHIC_CAPTION_WORDS,GRAPHIC_CAPTION_PHRASES

def words(text):return re.findall(r"[\w]+(?:['’][\w]+)?",text,flags=re.UNICODE)
def phrase_error(text):
 tokens=words(text)
 forbidden=sorted({t.lower() for t in tokens}&GRAPHIC_CAPTION_WORDS)
 forbidden.extend(p for p in GRAPHIC_CAPTION_PHRASES if p in text.lower())
 if forbidden:return 'caption describes graphics instead of the phenomenon: '+', '.join(forbidden)
 if not 2<=len(text.split())<=5:return 'caption must contain2–5 display words'
 if tokens and tokens[-1].lower() in BAD_END_EN|BAD_END_VI:return 'incomplete phrase ends with '+tokens[-1]
 return None

def visual_nouns(text,language='en'):
 if language!='en':return [] # Vietnamese noun spans must be explicit in the plan; validation requires them.
 import nltk
 from nltk.corpus import wordnet as wn
 tokens=words(text);tags=nltk.pos_tag(tokens);out=[]
 colors={'orange','blue','red','green','white','black','yellow','purple','pink','gray','grey'};sizes={'long','short','large','small','big','tiny','tall'};function=BAD_END_EN|{'where','here','there','this','these','those','it','nothing','something','anything','every','each'}
 visible={'noun.artifact','noun.object','noun.animal','noun.person','noun.plant','noun.body','noun.location','noun.substance','noun.shape','noun.food','noun.group','noun.quantity'}
 for i,(word,tag) in enumerate(tags):
  if word.lower() in function or role(word)!='object':continue
  noun_syn=wn.synsets(word.lower(),pos=wn.NOUN)
  # Short clauses can mistag a direction/manner adverb after the object as
  # NN ("Flow drags water outward"). No noun sense means no image-object noun;
  # preserve proper names and all words with genuine noun senses.
  if not noun_syn and not tag.startswith('NNP') and wn.synsets(word.lower(),pos=wn.ADV):continue
  if (word.lower() in sizes or wn.synsets(word.lower(),pos=wn.ADJ)) and i+1<len(tags) and (tags[i+1][0].lower() in colors or wn.synsets(tags[i+1][0].lower(),pos=wn.NOUN)):continue
  if word.lower() in colors and i+1<len(tags) and wn.synsets(tags[i+1][0].lower(),pos=wn.NOUN):continue
  if tag.startswith('VB') and not (i>0 and tags[i-1][0].lower() in colors|sizes):continue
  if i>0 and i+1<len(tags) and tags[i+1][0].lower() in {'to','toward','towards','through','across','over','into','along','outward'} and (tags[i-1][1].startswith('NN') or tags[i-1][1]=='PRP') and word.lower().endswith('s') and wn.morphy(word.lower(),wn.VERB) not in (None,word.lower()):continue
  modified=i>0 and tags[i-1][0].lower() in colors|sizes and bool(wn.synsets(word.lower(),pos=wn.NOUN))
  if not (tag.startswith('NN') or tag=='CD' or modified):continue
  lemma=wn.morphy(word.lower(),wn.NOUN) or word.lower();syn=wn.synsets(lemma,pos=wn.NOUN)
  # Proper names and unknown nouns cannot silently disappear from coverage.
  symbol=bool(syn and any(h.name().startswith(('visual_communication.','symbol.','visual_signal.')) for h in syn[0].closure(lambda q:q.hypernyms())))
  if tag=='CD' or modified or not syn or any(s.lexname() in visible for s in syn) or symbol:
   modifiers=[];j=i-1
   while j>=0 and (tags[j][1].startswith('JJ') or tags[j][0].lower() in colors|sizes):modifiers.insert(0,tags[j][0].lower());j-=1
   attrs={}
   if 'long' in modifiers:attrs['size']='long'
   if 'short' in modifiers:attrs['size']='short'
   for c in ('orange','blue','red','green','white','black','yellow','purple','pink','gray','grey'):
    if c in modifiers:attrs['color_name']=c
   out.append(dict(word=word,lemma=lemma,index=i,tag=tag,attributes=attrs,modifier_count=i-1-j))
 return out
