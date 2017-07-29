import requests
import urlparse
import base64
import os
import json
import socket
import time
from flask import Flask, request

app = Flask(__name__)

# configuration
domains = open('servers.txt').read().split('\n')[:-1]
directory = '/Users/Kyle/Downloads'
#https://d.pcs.baidu.com/rest/2.0/pcs/file?time=1501250608&version=2.2.0&vip=1&path=c681b5d6e90801ecf79c94f20e9a1831&fid=3892570184-250528-580625127441539&rt=sh&sign=FDTAERV-DCb740ccc5511e5e8fedcff06b081203-cxeW9Xee1lTRtcZVHG%2FYm6KV73g%3D&expires=8h&chkv=1&method=locatedownload&app_id=250528&esl=1&ver=4.0
#https://d.pcs.baidu.com/rest/2.0/pcs/file?vip=1&app_id=250528&method=locatedownload&path=%2Ftest.mkv&ver=4.0

@app.route('/rpc', methods=['GET'])
def main():

    # wrong request
    if 'link' not in request.args or not request.args['link']:
        return '0'
    
    link = base64.b64decode(request.args['link'])
    global domains
    global directory

    # in case that no bduss is passed
    if 'bduss' not in request.args or not request.args['bduss']:
        # catch true url
        r = requests.get(link, allow_redirects=False)
        url = r.headers['Location']
        
    else:
        # transfrom proxy link to api link
        link = url_transform(link)

        # retrieve all download links
        header = {'User-Agent': 'netdisk;2.2.0;macbaiduyunguanjia'}
        r = requests.get(link, headers=header, cookies={'BDUSS': request.args['bduss']})
        res = json.loads(r.content)

        # update recorded domains
        urls = [x['url'] for x in res['urls']]
        new_domains = [urlparse.urlparse(url).netloc for url in urls]
        s1 = set(domains)
        s2 = set(new_domains)
        domains += list(s2-s1)

    # parse url
    url = urls[0]
    parsed_url = urlparse.urlparse(url)
    parsed_query = urlparse.parse_qs(parsed_url.query)

    # make sure speed is not highly limited
    if int(parsed_query['csl'][0]) <= 10:
        print 'Speed limited. Trying again...'
        main()
        return '1'


    print 'This download will be at speed: %s' % parsed_query['csl'][0]

    time.sleep(2)

    # generate urls according to domains
    urls = []
    #parsed_url = parsed_url._replace(scheme='http')
    for domain in domains:
        #ip = socket.gethostbyname(domain)
        replaced = parsed_url._replace(netloc=domain)
        if 'cache' in domain:
            replaced = replaced._replace(scheme='http')
        url = urlparse.urlunparse(replaced)
        urls.append(url)

    # save temperary download links
    f = open('tmp_urls.txt', 'w')
    f.write('\t'.join(urls))
    f.close()

    # launch aria2
    os.system('aria2c -i tmp_urls.txt -k 1m -s %d -x 16 -d %s --console-log-level=error -U "netdisk;2.2.0;macbaiduyunguanjia" --check-certificate=false' % (16*len(urls), directory))


    return '1'


def url_transform(link):
    parsed_url = urlparse.urlparse(link)
    parsed_query = urlparse.parse_qs(parsed_url.query)
    url = 'https://d.pcs.baidu.com/rest/2.0/pcs/file?time=%s&version=2.2.0&vip=1&path=%s&fid=%s&rt=sh&sign=%s&expires=8h&chkv=1&method=locatedownload&app_id=250528&esl=0&ver=4.0' % (parsed_query['time'][0], parsed_url.path.split('/')[2], parsed_query['fid'][0], parsed_query['sign'][0])
    return url

if __name__ == '__main__':
    print ' * baidudl_rpc is running'
    app.run(host='127.0.0.1', port=8333, threaded=True)
