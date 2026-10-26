#!/bin/bash
# ==============================================================================
# Script khởi động NetFit Backend & Ngrok chạy ngầm độc lập trên macOS
# Tự động tách khỏi terminal (nohup + disown) để khi tắt IDE hay đổi dự án
# thì Backend và Ngrok vẫn chạy 24/7 không bị tắt.
# ==============================================================================

PROJECT_DIR="/Users/mac/Subject/SWP-projectFitness/swp391-su26-ai-audit-project-swp391_se20a02_group-06"
BACKEND_DIR="$PROJECT_DIR/backend/src/FitnessTrainingSystem.WebApi"
BACKEND_BIN="$BACKEND_DIR/bin/Debug/net9.0/FitnessTrainingSystem.WebApi"
BACKEND_LOG="$PROJECT_DIR/backend.log"
NGROK_LOG="$PROJECT_DIR/ngrok.log"

echo "======================================================="
echo "  🚀 ĐANG KHỞI ĐỘNG NETFIT BACKEND & NGROK CHẠY NGẦM"
echo "======================================================="

# 1. Kiểm tra và khởi động MySQL qua Homebrew
echo "[1/4] Kiểm tra dịch vụ MySQL..."
if ! nc -z 127.0.0.1 3306 >/dev/null 2>&1 && ! lsof -i :3306 >/dev/null 2>&1; then
    echo "  -> Đang khởi động MySQL service (brew services start mysql)..."
    brew services start mysql >/dev/null 2>&1 || true
    sleep 2
fi

if nc -z 127.0.0.1 3306 >/dev/null 2>&1 || lsof -i :3306 >/dev/null 2>&1; then
    echo "  ✅ MySQL đang chạy trên cổng 3306."
else
    echo "  ⚠️ Cảnh báo: Chưa tìm thấy MySQL trên cổng 3306. Vui lòng kiểm tra lại dịch vụ MySQL."
fi

# 2. Dọn dẹp tiến trình cũ trên cổng 5007 và ngrok
echo "[2/4] Dọn dẹp các tiến trình cũ..."
pkill -9 ngrok 2>/dev/null || true
lsof -ti :5007 | xargs kill -9 2>/dev/null || true
sleep 1

# 3. Build & Khởi động Backend (.NET 9 WebApi) chạy ngầm độc lập
echo "[3/4] Build & Khởi động Backend WebApi trên cổng 5007..."
cd "$BACKEND_DIR" || exit 1
dotnet build "$BACKEND_DIR/FitnessTrainingSystem.WebApi.csproj" -c Debug -v quiet --nologo

if [ ! -f "$BACKEND_BIN" ]; then
    echo "  ❌ Không tìm thấy file thực thi $BACKEND_BIN. Build thất bại!"
    exit 1
fi

# Khởi chạy bằng nohup, chuyển hướng toàn bộ I/O để tách hẳn khỏi TTY của IDE
nohup "$BACKEND_BIN" --urls http://localhost:5007 </dev/null > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
disown "$BACKEND_PID" 2>/dev/null || true
echo "$BACKEND_PID" > "$PROJECT_DIR/.netfit_backend.pid"

# Chờ Backend sẵn sàng
echo "  -> Đang đợi Backend khởi động..."
BACKEND_READY=false
for i in {1..20}; do
    sleep 1
    HEALTH=$(curl -s -m 2 http://localhost:5007/ 2>/dev/null || true)
    if [[ "$HEALTH" == *"healthy"* ]]; then
        BACKEND_READY=true
        break
    fi
done

if [ "$BACKEND_READY" = true ]; then
    echo "  ✅ Backend đã chạy thành công tại http://localhost:5007 (PID: $BACKEND_PID)"
else
    echo "  ⚠️ Backend đang khởi động hoặc kiểm tra log tại: $BACKEND_LOG"
fi

# 4. Khởi động Ngrok chạy ngầm độc lập
echo "[4/4] Khởi động Ngrok tunnel chạy ngầm..."
nohup ngrok http 5007 </dev/null > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!
disown "$NGROK_PID" 2>/dev/null || true
echo "$NGROK_PID" > "$PROJECT_DIR/.netfit_ngrok.pid"

sleep 3
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*ngrok-free.dev' | head -n 1)

echo ""
echo "======================================================="
echo "  🎉 HỆ THỐNG ĐÃ ĐƯỢC CHẠY NGẦM ĐỘC LẬP THÀNH CÔNG!"
echo "======================================================="
echo "  📍 Backend Local   : http://localhost:5007"
echo "  📍 Swagger Docs    : http://localhost:5007/swagger"
if [ -n "$NGROK_URL" ]; then
    echo "  🌐 Ngrok Public URL: $NGROK_URL"
    echo "  🌐 API Public URL  : $NGROK_URL/api"
else
    echo "  🌐 Ngrok đang khởi tạo, kiểm tra tại http://127.0.0.1:4040"
fi
echo "  📄 Backend Log     : $BACKEND_LOG"
echo "  📄 Ngrok Log       : $NGROK_LOG"
echo "======================================================="
echo "💡 Bạn có thể tắt hoàn toàn Antigravity IDE hoặc mở dự án khác,"
echo "   Backend và Ngrok vẫn sẽ chạy ngầm bình thường trên macOS!"
echo "   Để kiểm tra trạng thái: ./status_netfit.sh"
echo "   Để dừng dịch vụ      : ./stop_netfit.sh"
echo "======================================================="
