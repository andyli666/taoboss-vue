# 构建并发布项目步骤
```## 1. 构建项目
```bash
npm run build
```
## 2. 删除远程旧版本文件
```bash
ssh -i C:\Users\64621\OneDrive\文档\技术\云主机密钥\i-8vbesag603mz6ldyn8sk.pem root@39.98.161.6 "rm -rf /srv/vue/dist/*"
```
## 3. 上传新版本文件到远程
```bash
scp -i C:\Users\64621\OneDrive\文档\技术\云主机密钥\i-8vbesag603mz6ldyn8sk.pem -r dist/* root@39.98.161.6:/srv/vue/dist/
```
此部署方案会在已删除旧版文件夹且新版本文件未上传完成时，导致服务不可用。所以已不推荐使用。新版本部署方案请参考[deploy.sh](/deploy.sh)。