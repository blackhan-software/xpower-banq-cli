#!/usr/bin/env bash

systemctl restart banq-ri@APOW:supply:P000.service
systemctl restart banq-ri@APOW:borrow:P000.service
systemctl restart banq-ri@XPOW:supply:P000.service
systemctl restart banq-ri@XPOW:borrow:P000.service

systemctl restart banq-ri@APOW:supply:P001.service
systemctl restart banq-ri@APOW:borrow:P001.service
systemctl restart banq-ri@AVAX:supply:P001.service
systemctl restart banq-ri@AVAX:borrow:P001.service

systemctl restart banq-ri@APOW:supply:P002.service
systemctl restart banq-ri@APOW:borrow:P002.service
systemctl restart banq-ri@USDC:supply:P002.service
systemctl restart banq-ri@USDC:borrow:P002.service

systemctl restart banq-ri@APOW:supply:P003.service
systemctl restart banq-ri@APOW:borrow:P003.service
systemctl restart banq-ri@USDT:supply:P003.service
systemctl restart banq-ri@USDT:borrow:P003.service
