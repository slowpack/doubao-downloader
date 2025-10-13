![doubao-downloader](https://socialify.git.ci/LauZzL/doubao-downloader/image?custom_language=React&description=1&forks=1&issues=1&language=1&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Dark)

## 项目介绍

**基于 React 开发的豆包AI无水印资源批量下载浏览器扩展/油猴脚本。**

![KOLd7Hv.gif](https://iili.io/KOLd7Hv.gif)


## 开始使用

> 实现思路可以查看我的另一个仓库：[通过HOOK掉JSON.parse实现豆包AI无水印下载教程](https://github.com/LauZzL/remove-doubao-images)

### 以油猴脚本形式使用

[打包](#打包)成功后或到[Releases](./releases)下载构建好的脚本文件，将 `doubao-downloader.user.js` 添加到油猴扩展中使用。

### 以浏览器扩展形式使用

> 在浏览器扩展使用需要打开 `开发者模式` 选项。

- 手动[打包](#打包)后，在浏览器扩展页面中选择 `加载未打包的扩展程序`，选择 `dist` 目录，导入即可。

![KOLlEle.png](https://iili.io/KOLlEle.png)

- 或[Releases](./releases)下载 `.crx` 或 `.zip` 文件， `.crx` 文件可直接拖入浏览器中安装，`.zip` 文件需要解压后导入。

## 预览

#### 发现新图片

![KOLd7Hv.gif](https://iili.io/KOLd7Hv.gif)

#### 对话实时获取

![KOLmij1.gif](https://iili.io/KOLmij1.gif)

#### 无水印预览

![KOLyuON.png](https://iili.io/KOLyuON.png)

#### 所有图片

![KOLQdZJ.gif](https://iili.io/KOLQdZJ.gif)

## 开发环境

- [React 19](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)

## 参与开发

加入该项目同开发者共同维护。

- 你可以通过 [PR](./pulls) 对项目代码做出贡献
- 你可以通过 [Issues](./issues) 提交问题或提出建议

### 本地开发(基于油猴)

```shell
# 安装依赖
yarn install

# 启动开发环境:油猴开发环境
yarn dev
```

### 打包

打包后会在项目目录下生成 `dist` 文件夹，文件中会包含浏览器扩展所需要的相关文件，以及主要脚本。

```shell
# 打包
yarn build
```


## 免责声明

本项目仅供学习交流，请勿用于商业、非法用途。