#!/usr/bin/env python3

import os
import subprocess
import time

ROOT_FILEPATH = '../' # TODO: `solana-programs`
PIPE_FILEPATH = './hack/hostpipe.txt'

def tail(thefile):
    thefile.seek(0,2)
    while True:
        line = thefile.readline()
        if not line:
            time.sleep(1)
            continue
        yield line

if __name__ == '__main__':
    os.chdir(ROOT_FILEPATH)
    # create if not exists
    open(PIPE_FILEPATH, 'w').close()
    # tail in read mode so container can write to it
    for cmd in tail(open(PIPE_FILEPATH, 'r')):
        try:
            stdout = subprocess.run(cmd, shell=True, check=True)
        except Exception as e:
            print(e)
