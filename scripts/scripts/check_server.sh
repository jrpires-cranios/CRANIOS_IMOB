#!/bin/bash
# Monitor de saúde do servidor — envia alerta via Telegram se CPU > 80% ou RAM > 85%

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
HOSTNAME=$(hostname)

send_telegram() {
  local message="$1"
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=${message}" \
      -d "parse_mode=Markdown" > /dev/null 2>&1
  fi
}

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1 | awk '{printf "%.0f", $1}')

# RAM usage
RAM_TOTAL=$(free -m | awk 'NR==2{print $2}')
RAM_USED=$(free -m | awk 'NR==2{print $3}')
RAM_PERCENT=$(awk "BEGIN{printf \"%.0f\", ${RAM_USED}/${RAM_TOTAL}*100}")

# Disk usage
DISK_PERCENT=$(df / | awk 'NR==2{print $5}' | tr -d '%')

ALERT=false
MESSAGE="⚠️ *ALERTA SERVIDOR* — ${HOSTNAME}\n"

if [ "$CPU_PERCENT" -gt 80 ] 2>/dev/null; then
  MESSAGE="${MESSAGE}🔴 CPU: ${CPU_USAGE}% (limite: 80%)\n"
  ALERT=true
fi

if [ "$RAM_PERCENT" -gt 85 ] 2>/dev/null; then
  MESSAGE="${MESSAGE}🔴 RAM: ${RAM_PERCENT}% (${RAM_USED}MB/${RAM_TOTAL}MB)\n"
  ALERT=true
fi

if [ "$DISK_PERCENT" -gt 85 ] 2>/dev/null; then
  MESSAGE="${MESSAGE}🔴 Disco: ${DISK_PERCENT}%\n"
  ALERT=true
fi

if [ "$ALERT" = true ]; then
  send_telegram "${MESSAGE}"
  echo "[$(date)] ALERTA enviado: CPU=${CPU_USAGE}% RAM=${RAM_PERCENT}% DISK=${DISK_PERCENT}%"
fi

# Verificar se backend está respondendo
if ! curl -sf http://localhost:3005/api/health > /dev/null 2>&1; then
  send_telegram "🚨 *BACKEND OFFLINE* — ${HOSTNAME}\nAPI não está respondendo em :3005"
  echo "[$(date)] Backend offline!"
  # Tentar restart
  cd /opt/cranios-imob && docker-compose restart backend
fi
