"""Explicit one-time NLP model setup; no network inside acceptance gates."""
import os
from pathlib import Path
import nltk
root=Path(os.environ.get('NLTK_DATA','work/gate_nlp')).resolve();root.mkdir(parents=True,exist_ok=True)
for package in ('wordnet','averaged_perceptron_tagger_eng'):
 if not nltk.download(package,download_dir=str(root),quiet=True):raise SystemExit('Cannot install NLP data '+package)
print('NLTK_DATA='+str(root))
