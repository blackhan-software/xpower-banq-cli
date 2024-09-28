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
    '-t', '--token', type=str, help='Token to include in the title')
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
    # Extract the JSON part of the line
    json_part = line.split(' ', 2)[2]
    records = json.loads(json_part)
    for record in records:
        utils.append(float(record['U']))
        suras.append(float(record['S']))
        boras.append(float(record['B']))
        dates.append(datetime.fromisoformat(record['T']))

#######################################################################
# Plotting

fig, ax1 = plt.subplots()
plt.grid()

ax1.set_ylabel('Supply- & Borrow-Rate')
line1, = ax1.plot(
    dates, suras, label='Supply Rate', color='tab:blue', linestyle='dotted')
line2, = ax1.plot(
    dates, boras, label='Borrow Rate', color='tab:red', linestyle='dotted')
ax1.tick_params(axis='y')

ax2 = ax1.twinx()
ax2.set_ylabel('Utilization')
line3, = ax2.plot(
    dates, utils, label='Utilization', color='tab:green')
ax2.fill_between(
    dates, utils, color='green', alpha=0.1)
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
