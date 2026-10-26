#!/bin/bash
# ==============================================================================
# Script kiểm tra trạng thái Backend, Ngrok & Database trên macOS
# ==============================================================================

echo "======================================================="
echo "  📊 KIỂM TRA TRẠNG THÁI HỆ THỐNG NETFIT (macOS)"
echo "======================================================="

# 1. MySQL Status
echo -n "1. Database (MySQL 3306) : "
if lsof -i :3306 >/dev/null 2>&1; then
    echo "🟢 ĐANG CHẠY"
else
    echo "🔴 ĐÃ TẮT (Gõ: brew services start mysql)"
fi

# 2. Backend Local Status
echo -n "2. Backend (Port 5007)   : "
HEALTH=$(curl -s -m 2 http://localhost:5007/ 2>/dev/null || true)
if [[ "$HEALTH" == *"healthy"* ]]; then
    PID=$(lsof -ti :5007 | head -n 1)
    echo "🟢 ĐANG CHẠY (PID: $PID)"
    echo "   -> Phản hồi: $HEALTH"
else
    echo "🔴 KHÔNG PHẢN HỒI"
fi

# 3. Ngrok Status
echo -n "3. Ngrok Tunnel          : "
NGROK_URL=$(curl -s -m 2 http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*ngrok-free.dev' | head -n 1)
if [ -n "$NGROK_URL" ]; then
    echo "🟢 ĐANG HOẠT ĐỘNG"
    echo "   -> Public URL: $NGROK_URL"
    echo "   -> API URL   : $NGROK_URL/api"
    
    # Test ngrok public response
    NGROK_TEST=$(curl -s -m 3 -H "ngrok-skip-browser-warning: 1" "$NGROK_URL/" 2>/dev/null || true)
    if [[ "$NGROK_TEST" == *"healthy"* ]]; then
        echo "   -> Kết nối Public: 🟢 200 OK (Backend phản hồi tốt qua internet)"
    else
        echo "   -> Kết nối Public: 🟡 Đang chờ Backend..."
    fi
else
    echo "🔴 ĐÃ TẮT"
fi

echo "======================================================="
