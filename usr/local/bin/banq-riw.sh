#!/usr/bin/env bash

systemctl restart "banq-riw@APOW:supply:P000.service"
systemctl restart "banq-riw@APOW:borrow:P000.service"
systemctl restart "banq-riw@XPOW:supply:P000.service"
systemctl restart "banq-riw@XPOW:borrow:P000.service"

systemctl restart "banq-riw@APOW:supply:P001.service"
systemctl restart "banq-riw@APOW:borrow:P001.service"
systemctl restart "banq-riw@AVAX:supply:P001.service"
systemctl restart "banq-riw@AVAX:borrow:P001.service"

systemctl restart "banq-riw@APOW:supply:P002.service"
systemctl restart "banq-riw@APOW:borrow:P002.service"
systemctl restart "banq-riw@USDC:supply:P002.service"
systemctl restart "banq-riw@USDC:borrow:P002.service"

systemctl restart "banq-riw@APOW:supply:P003.service"
systemctl restart "banq-riw@APOW:borrow:P003.service"
systemctl restart "banq-riw@USDT:supply:P003.service"
systemctl restart "banq-riw@USDT:borrow:P003.service"

systemctl restart "banq-riw@XPOW:supply:P004.service"
systemctl restart "banq-riw@XPOW:borrow:P004.service"
systemctl restart "banq-riw@AVAX:supply:P004.service"
systemctl restart "banq-riw@AVAX:borrow:P004.service"

systemctl restart "banq-riw@XPOW:supply:P005.service"
systemctl restart "banq-riw@XPOW:borrow:P005.service"
systemctl restart "banq-riw@USDC:supply:P005.service"
systemctl restart "banq-riw@USDC:borrow:P005.service"

systemctl restart "banq-riw@XPOW:supply:P006.service"
systemctl restart "banq-riw@XPOW:borrow:P006.service"
systemctl restart "banq-riw@USDT:supply:P006.service"
systemctl restart "banq-riw@USDT:borrow:P006.service"
