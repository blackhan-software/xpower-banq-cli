#!/usr/bin/env bash

systemctl restart banq-rt@AVAX_APOW.service
systemctl restart banq-rt@USDC_APOW.service
systemctl restart banq-rt@USDT_APOW.service
systemctl restart banq-rt@XPOW_APOW.service
