#!/usr/bin/env bash

systemctl restart banq-rt@XPOW_APOW:T000.service
systemctl restart banq-rt@AVAX_APOW:T001.service
systemctl restart banq-rt@USDC_APOW:T002.service
systemctl restart banq-rt@USDT_APOW:T003.service
