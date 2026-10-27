"""Resolution-scoped measurement files for the shared B pipeline."""
import os
from pathlib import Path

def output_root(workspace, short_side=None):
 short=int(os.environ.get('B_SHORT_SIDE','540') if short_side is None else short_side)
 if short not in (540,1080):raise ValueError('Unsupported sample short side: '+str(short))
 return Path(workspace)/'work'/('B' if short==540 else 'B1080')
