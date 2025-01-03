#!/usr/bin/env bash

systemctl restart "banq-rtw@XPOW_APOW:T000.service"
systemctl restart "banq-rtw@AVAX_APOW:T001.service"
systemctl restart "banq-rtw@USDC_APOW:T002.service"
systemctl restart "banq-rtw@USDT_APOW:T003.service"
systemctl restart "banq-rtw@AVAX_XPOW:T004.service"
systemctl restart "banq-rtw@USDC_XPOW:T005.service"
systemctl restart "banq-rtw@USDT_XPOW:T006.service"

systemctl restart "banq-rtw@APOW_XPOW:T000.service"
systemctl restart "banq-rtw@APOW_AVAX:T001.service"
systemctl restart "banq-rtw@APOW_USDC:T002.service"
systemctl restart "banq-rtw@APOW_USDT:T003.service"
systemctl restart "banq-rtw@XPOW_AVAX:T004.service"
systemctl restart "banq-rtw@XPOW_USDC:T005.service"
systemctl restart "banq-rtw@XPOW_USDT:T006.service"
