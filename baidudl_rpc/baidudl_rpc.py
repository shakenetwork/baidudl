import os
import sys

f = sys.argv[0]
d = os.path.realpath(os.path.join(f, os.path.pardir))

os.chdir(d)

aria2 = os.path.join(d, 'aria2c')

print ''
print 'baidudl_rpc is ready...'
os.system(aria2+' --enable-rpc --console-log-level=error --rpc-allow-origin-all=true --rpc-listen-port=6800')
