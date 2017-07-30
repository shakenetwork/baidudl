# -*- coding: utf-8 -*-
import requests
import subprocess
import urlparse
import base64
import os
import json
import socket
import time
from threading import Thread
from HTMLParser import HTMLParser
from flask import Flask, request

app = Flask(__name__)

# configuration
domains = open('servers.txt').read().split('\n')[:-1]
import config as cfg
directory = cfg.directory
max_threads = cfg.max_threads
h = HTMLParser()

# launch aria2 rpc
subprocess.Popen(['aria2c', '--enable-rpc', '--rpc-listen-port=6800', '--console-log-level=warn', '--rpc-secret=baidudl', '--rpc-allow-origin-all=true', '--rpc-listen-all=true'])

@app.route('/rpc', methods=['GET'])
def main(count=0):

    # wrong request
    if 'link' not in request.args or not request.args['link']:
        return '0'
    
    # initialization
    link = base64.b64decode(request.args['link'])
    global domains
    global directory

    # expand domain
    if 'bduss' in request.args and request.args['bduss']:
        try:
            # transfrom proxy link to api link
            link2 = url_transform(link)

            # retrieve all download links
            header = {'User-Agent': 'netdisk;2.2.0;macbaiduyunguanjia'}
            r = requests.get(link2, headers=header, cookies={'BDUSS': request.args['bduss']})
            res = json.loads(r.content)

            # update recorded domains
            urls = [x['url'] for x in res['urls']]
            new_domains = [urlparse.urlparse(url).netloc for url in urls]
            s1 = set(domains)
            s2 = set(new_domains)
            domains += list(s2-s1)
        except Exception as e:
            print e

    # catch true url
    r = requests.get(link, allow_redirects=False)
    url = r.headers['Location']


    # parse url
    parsed_url = urlparse.urlparse(url)
    parsed_query = urlparse.parse_qs(parsed_url.query)

    # make sure speed is not highly limited
    if int(parsed_query['csl'][0]) <= 10:
        count += 1
        print 'Speed limited. Trying again...%d times' % count
        if count <= 10:
            main(count)
        else:
            print 'Your account is stricly banned. Please download in share page in Incognito mode.'
        return '1'


    print 'This download will be at speed: %s' % parsed_query['csl'][0]

    time.sleep(2)

    # generate urls according to domains
    urls = []
    #parsed_url = parsed_url._replace(scheme='http')
    for domain in domains:
        replaced = parsed_url._replace(netloc=domain)
        if 'cache' in domain:
            replaced = replaced._replace(scheme='http')
        url = urlparse.urlunparse(replaced)
        urls.append(url)

    # save temperary download links
    f = open('tmp_urls.txt', 'w')
    f.write('\t'.join(urls).encode('utf-8'))
    f.close()

    # launch aria2
    threads = max_threads if (16*len(urls) > max_threads) else 16*len(urls)

    # prepare json request
    options = {}
    options['split'] = str(threads)
    options['max-connection-per-server'] = '16'
    options['user-agent'] = 'netdisk;2.2.0;macbaiduyunguanjia'
    options['check-certificate'] = 'false'
    options['dir'] = directory
    options['min-split-size'] = '1m'
    options['summary-interval'] = '0'
    params = []
    params.append('token:baidudl')
    params.append(urls)
    params.append(options)
    jsonreq = {}
    jsonreq['jsonrpc'] = '2.0'
    jsonreq['id'] = parsed_query['fin']
    jsonreq['method'] = 'aria2.addUri'
    jsonreq['params'] = params

    # send json request
    jsonreq = json.dumps(jsonreq)
    r = requests.post('http://localhost:6800/jsonrpc', jsonreq)

    return '1'


def url_transform(link):
    parsed_url = urlparse.urlparse(link)
    parsed_query = urlparse.parse_qs(parsed_url.query)
    url = 'https://d.pcs.baidu.com/rest/2.0/pcs/file?time=%s&version=2.2.0&vip=1&path=%s&fid=%s&rt=sh&sign=%s&expires=8h&chkv=1&method=locatedownload&app_id=250528&esl=0&ver=4.0' % (parsed_query['time'][0], parsed_url.path.split('/')[2], parsed_query['fid'][0], parsed_query['sign'][0])
    return url

if __name__ == '__main__':
    print ' * baidudl_rpc is running'
    app.run(host='127.0.0.1', port=8333, threaded=True)
