import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    compression({
      verbose: true, // 输出压缩日志
      disable: false, // 是否禁用压缩
      threshold: 10240, // 对超过10KB的文件进行压缩
      algorithm: 'gzip', // 使用gzip压缩
      ext: '.gz', // 压缩后文件的扩展名
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.taoboss.com.cn/',  // 后端API地址
        changeOrigin: true,  // 是否修改请求头中的Origin
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径
      },
    },
  },
})
