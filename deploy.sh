#!/bin/bash

# 1. 设置你的变量（注意路径格式，Git Bash 推荐用 /c/ 代替 C:\）
# 也可以保持相对路径，因为已经 cd 到项目里了
SERVER="root@39.98.161.6"
KEY="/c/Users/64621/OneDrive/文档/技术/云主机密钥/i-8vbesag603mz6ldyn8sk.pem" # 注意这里的路径格式

# 确保在项目根目录
cd "$(dirname "$0")"

echo -e "\033[36m=====================================\033[0m"
echo -e "\033[36m开始部署流程...\033[0m"
echo -e "\033[36m=====================================\033[0m"

# 2. 检查 Git 状态
if [ -n "$(git status --porcelain)" ]; then
    echo -e "\033[33m警告：当前有未提交的代码修改！\033[0m"
    read -p "确定要继续部署吗？(y/n): " continue_deploy
    if [ "$continue_deploy" != "y" ]; then
        exit 1
    fi
fi

# 3. 构建项目
echo -e "\033[32m[1/5] 正在构建项目...\033[0m"
npm run build
if [ $? -ne 0 ]; then
    echo -e "\033[31m构建失败！请检查错误信息。终止部署。\033[0m"
    exit 1
fi

# 4. 获取 Commit ID
echo -e "\033[32m[2/5] 获取 Git Commit ID...\033[0m"
COMMIT_ID=$(git rev-parse --short HEAD)
REMOTE_DIR="/srv/vue/releases/$COMMIT_ID"
echo -e "\033[32m当前版本: $COMMIT_ID\033[0m"

# 5. 远程创建版本文件夹
echo -e "\033[32m[3/5] 创建远程目录...\033[0m"
ssh -i "$KEY" $SERVER "mkdir -p $REMOTE_DIR"

# 6. 上传文件
echo -e "\033[32m[4/5] 上传文件到服务器...\033[0m"
scp -r -i "$KEY" ./dist/* "${SERVER}:${REMOTE_DIR}/"
if [ $? -ne 0 ]; then
    echo -e "\033[31m上传失败！终止部署。\033[0m"
    exit 1
fi

# 7. 切换软链接并重载 Nginx
echo -e "\033[32m[5/5] 切换软链接并重载 Nginx...\033[0m"
ssh -i "$KEY" $SERVER "ln -snf $REMOTE_DIR /srv/vue/current && nginx -s reload"

echo -e "\033[36m=====================================\033[0m"
echo -e "\033[36m部署完成！\033[0m"
echo -e "\033[36m=====================================\033[0m"