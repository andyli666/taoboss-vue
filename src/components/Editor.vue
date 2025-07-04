<template>
    <div style="border: 1px solid #ccc">
        <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
            :mode="mode" />
        <Editor style="width:650px;height:500px; overflow-y:hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
            :mode="mode" @onCreated="handleCreated" />
    </div>
</template>
<script setup>
import '@wangeditor/editor/dist/css/style.css' // 引入 css

import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = ref('<p>hello</p>')

// 模拟 ajax 异步获取内容
onMounted(() => {
    setTimeout(() => {
        valueHtml.value = '<p>模拟 Ajax 异步设置内容</p>'
    }, 1500)
})

const toolbarConfig = {}
const mode = 'simple' // 或 'default'
toolbarConfig.toolbarKeys = [
    {
        "key": "group-image",
        "title": "图片",
        "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z\"></path></svg>",
        "menuKeys": [
            "insertImage",
            "uploadImage"
        ]
    },
    '|',
    'redo',
    'undo',
]
const editorConfig = { MENU_CONF: {}, placeholder: '请输入内容...', showLinkImgAlt: false, showLinkImgHref: false }
editorConfig.MENU_CONF['uploadImage'] = {
    fieldName: 'image',
    server: '/api/upload',
}
editorConfig.hoverbarKeys = {
    image: {
        menuKeys: ['editImage', 'viewImageLink', 'deleteImage'],
    },
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor) => {
    editorRef.value = editor // 记录 editor 实例，重要！
    console.log(editor.getMenuConfig('uploadImage'))
    console.log(editor.getConfig().hoverbarKeys)
    console.log(editor.getConfig())
}
</script>