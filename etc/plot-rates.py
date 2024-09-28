#!/usr/bin/env python
#######################################################################

import sys
import json
import argparse
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime

#######################################################################
# Argument parsing

parser = argparse.ArgumentParser(
    description='Plot supply and borrow rates.')
parser.add_argument(
    '-t', '--token', type=str,
    help='Token to include in the title')
parser.add_argument(
    '-y', '--log-y', action='store_true',
    help='Set y-axis to logarithmic scale')
args = parser.parse_args()

#######################################################################
# Read data from stdin

data = sys.stdin.read()

#######################################################################
# Parse the data

lines = data.strip().split('\n')
utils = [] # utilizations
suras = [] # supply rates
boras = [] # borrow rates
dates = [] # timestamps

for line in lines:
    records = json.loads(line)
    for record in records:
        utils.append(float(record['u']))
        suras.append(float(record['s']))
        boras.append(float(record['b']))
        dates.append(datetime.fromisoformat(record['t']))

#######################################################################
# Plotting

fig, ax1 = plt.subplots()
plt.grid()

# 1st y-axis for utilization rates
if args.log_y: ax1.set_yscale('log')
ax1.set_ylabel('Utilization')
line1, = ax1.step(
    dates, utils, label='Utilization', color='tab:blue', where='post')
ax1.fill_between(
    dates, utils, color='blue', alpha=0.1, step='post')
ax1.tick_params(axis='y')

# 2nd y-axis for supply and borrow rates
ax2 = ax1.twinx()
if args.log_y:  ax2.set_yscale('log')
ax2.set_ylabel('Supply- & Borrow-Rate')
line2, = ax2.step(
    dates, suras, label='Supply Rate', color='tab:green', linestyle='dotted', where='post')
line3, = ax2.step(
    dates, boras, label='Borrow Rate', color='tab:red', linestyle='dotted', where='post')
ax2.tick_params(axis='y')

# Format x-axis
ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
fig.autofmt_xdate(rotation=30, ha='right')
plt.setp(ax1.get_xticklabels(), fontsize=8)

# Add legends
lines = [line1, line2, line3]
labels = [line.get_label() for line in lines]
ax1.legend(lines, labels, loc='upper left')

fig.tight_layout()
title = 'Utilization -vs- Supply- & Borrow-Rate'
if args.token: title += f' for {args.token.upper()}'
plt.title(title, fontweight='bold')
plt.show()

#######################################################################
#######################################################################
