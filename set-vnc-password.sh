#!/bin/bash
# VNC 密码设置脚本

echo "正在设置 VNC 密码..."
echo ""
echo "请输入新密码（至少 6 位）:"
stty -echo
read PASSWORD1
echo ""
echo "请确认密码:"
read PASSWORD2
stty echo

if [ "$PASSWORD1" = "$PASSWORD2" ]; then
    echo "$PASSWORD1" | vncpasswd -f -w
    echo ""
    echo "✅ VNC 密码设置成功！"
    echo "密码: $PASSWORD1"
else
    echo ""
    echo "❌ 两次输入的密码不匹配"
    exit 1
fi
