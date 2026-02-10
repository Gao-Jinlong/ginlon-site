# 云服务器 GUI 环境安装进行中...

## 当前状态

### 安装进度
- ✅ apt-get update 完成
- 🔄 正在安装 VNC 服务器组件
  - tigervnc-standalone-server
  - fluxbox（窗口管理器）
  - x11-xserver-utils（X11 库）
  - firefox（浏览器）

### 系统资源
- **内存**: 1.6GB（使用 641MB，可用 873MB）
- **磁盘**: 40GB（使用 7.3GB，可用 30GB）

### 预期完成时间
- 安装包：~3-5 分钟
- 配置：~1-2 分钟
- 总计：~5-7 分钟

---

## 安装完成后

### 快速启动指南

```bash
# 1. 设置 VNC 密码
vncpasswd

# 2. 复制启动脚本
cp vnc-xstartup ~/.vnc/xstartup
chmod +x ~/.vnc/xstartup

# 3. 启动 VNC 服务器
vncserver :1 -geometry 1920x1080 -depth 24

# 4. 获取服务器 IP
curl -s ifconfig.me
```

### 连接方式

#### VNC 客户端连接
1. 下载 VNC 客户端
   - macOS: TigerVNC 或 RealVNC
   - Windows: RealVNC Viewer
   - Linux: Remmina 或 TigerVNC

2. 连接信息
   - 地址：`your-server-ip:5901`
   - 密码：你设置的 VNC 密码

#### SSH 隧道（推荐，更安全）
```bash
# 在本地机器上执行
ssh -L 5901:localhost:5901 root@your-server-ip

# 然后在 VNC 客户端连接
# 地址：localhost:5901
# 密码：VNC 密码
```

---

## 启动后可以做什么

### 1. 访问设计预览

在 VNC 桌面中：
1. 打开终端（Ctrl+Alt+T）
2. 运行：
```bash
firefox /root/.openclaw/workspace/ginlon-site/design-preview.html
```

### 2. 使用图形工具

可以安装和运行：
- Pencil（需要从官网下载）
- Figma（在线工具）
- GIMP（图像编辑）
- Inkscape（矢量编辑）

### 3. 截图导出

在 VNC 桌面中：
1. 使用系统截图工具
2. 或安装截图工具：
```bash
apt-get install -y scrot
# 使用: scrot -s screenshot.png
```

---

## 管理命令

### 启动 VNC
```bash
vncserver :1 -geometry 1920x1080 -depth 24
```

### 停止 VNC
```bash
vncserver -kill :1
```

### 重启 VNC
```bash
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24
```

### 查看状态
```bash
# 查看进程
ps aux | grep vnc

# 查看端口
netstat -tuln | grep 5901
```

---

## 安全建议

### 使用 SSH 隧道（强烈推荐）

```bash
# 本地机器执行
ssh -L 5901:localhost:5901 root@your-server-ip

# 然后连接 localhost:5901
# VNC 密码：你设置的密码
```

### 限制访问 IP

```bash
# 只允许特定 IP 访问 VNC
iptables -A INPUT -p tcp --dport 5901 -s YOUR_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 5901 -j DROP
```

---

## 故障排除

### 连接超时
```bash
# 检查防火墙
ufw status

# 如果被阻止，开放端口
ufw allow 5901/tcp
```

### 无法显示窗口
```bash
# 检查 X 服务器
ps aux | grep Xvnc

# 检查窗口管理器
ps aux | grep fluxbox
```

### 内存不足
```bash
# 使用更小的分辨率
vncserver :1 -geometry 1280x720 -depth 16
```

---

## 下一步

安装完成后：

1. ✅ 连接到 VNC 服务器
2. ✅ 在浏览器中打开设计预览
3. ✅ 查看改版后的效果
4. ✅ 截图或告诉我反馈

**请稍等，安装正在进行中...** ⏳
