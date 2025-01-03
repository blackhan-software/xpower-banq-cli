#!/usr/bin/env bash

systemctl restart banq-rt@XPOW_APOW:T000.service
systemctl restart banq-rt@AVAX_APOW:T001.service
systemctl restart banq-rt@USDC_APOW:T002.service
systemctl restart banq-rt@USDT_APOW:T003.service

systemctl restart banq-rt@APOW_XPOW:T000.service
systemctl restart banq-rt@APOW_AVAX:T001.service
systemctl restart banq-rt@APOW_USDC:T002.service
systemctl restart banq-rt@APOW_USDT:T003.service
