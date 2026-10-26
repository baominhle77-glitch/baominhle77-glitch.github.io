"""Local convenience; CI uses six matrix jobs then compose.py."""
import subprocess,sys
for beat in ('h1','h2','h3','h4','c1','p1'):
 subprocess.run([sys.executable,'ci/remotion_b/prepare.py','--beat',beat,'--jobs','1'],check=True)
subprocess.run([sys.executable,'ci/remotion_b/compose.py'],check=True)
