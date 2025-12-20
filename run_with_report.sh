#!/bin/bash
TEST_FILE=$1
REPORT_NAME=${2:-"report.html"}

if [ -z "$TEST_FILE" ]; then
  echo "Uso: ./run_with_report.sh <arquivo_de_teste> [nome_do_relatorio]"
  echo "Exemplo: ./run_with_report.sh tests/login.js relatorio-login.html"
  exit 1
fi

# Configurações do Web Dashboard
export K6_WEB_DASHBOARD=true
export K6_WEB_DASHBOARD_EXPORT=$REPORT_NAME
export K6_WEB_DASHBOARD_PERIOD=2s

echo "Executando $TEST_FILE com relatório HTML em $REPORT_NAME..."
./k6.exe run $TEST_FILE
