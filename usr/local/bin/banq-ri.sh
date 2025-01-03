#!/usr/bin/env bash

systemctl restart "banq-ri@APOW:supply:P000.service"
systemctl restart "banq-ri@APOW:borrow:P000.service"
systemctl restart "banq-ri@XPOW:supply:P000.service"
systemctl restart "banq-ri@XPOW:borrow:P000.service"

systemctl restart "banq-ri@APOW:supply:P001.service"
systemctl restart "banq-ri@APOW:borrow:P001.service"
systemctl restart "banq-ri@AVAX:supply:P001.service"
systemctl restart "banq-ri@AVAX:borrow:P001.service"

systemctl restart "banq-ri@APOW:supply:P002.service"
systemctl restart "banq-ri@APOW:borrow:P002.service"
systemctl restart "banq-ri@USDC:supply:P002.service"
systemctl restart "banq-ri@USDC:borrow:P002.service"

systemctl restart "banq-ri@APOW:supply:P003.service"
systemctl restart "banq-ri@APOW:borrow:P003.service"
systemctl restart "banq-ri@USDT:supply:P003.service"
systemctl restart "banq-ri@USDT:borrow:P003.service"

systemctl restart "banq-ri@XPOW:supply:P004.service"
systemctl restart "banq-ri@XPOW:borrow:P004.service"
systemctl restart "banq-ri@AVAX:supply:P004.service"
systemctl restart "banq-ri@AVAX:borrow:P004.service"

systemctl restart "banq-ri@XPOW:supply:P005.service"
systemctl restart "banq-ri@XPOW:borrow:P005.service"
systemctl restart "banq-ri@USDC:supply:P005.service"
systemctl restart "banq-ri@USDC:borrow:P005.service"

systemctl restart "banq-ri@XPOW:supply:P006.service"
systemctl restart "banq-ri@XPOW:borrow:P006.service"
systemctl restart "banq-ri@USDT:supply:P006.service"
systemctl restart "banq-ri@USDT:borrow:P006.service"
