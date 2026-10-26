#!/bin/bash
# ==============================================================================
# Script dừng Backend và Ngrok đang chạy ngầm trên macOS
# ==============================================================================

PROJECT_DIR="/Users/mac/Subject/SWP-projectFitness/swp391-su26-ai-audit-project-swp391_se20a02_group-06"

echo "======================================================="
echo "  🛑 ĐANG DỪNG NETFIT BACKEND & NGROK"
echo "======================================================="

# Dừng Ngrok
echo "  -> Đang dừng tiến trình Ngrok..."
pkill -9 ngrok 2>/dev/null || true
rm -f "$PROJECT_DIR/.netfit_ngrok.pid" 2>/dev/null || true

# Dừng Backend cổng 5007
echo "  -> Đang dừng tiến trình Backend trên cổng 5007..."
lsof -ti :5007 | xargs kill -9 2>/dev/null || true
rm -f "$PROJECT_DIR/.netfit_backend.pid" 2>/dev/null || true

sleep 1
if ! lsof -i :5007 >/dev/null 2>&1; then
    echo "  ✅ Đã giải phóng hoàn toàn cổng 5007."
fi

echo "======================================================="
echo "  ✅ Toàn bộ Backend và Ngrok đã dừng thành công!"
echo "======================================================="
