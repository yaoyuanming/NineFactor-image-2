# NineFactor-image-2

九因科技 AI 图片生成 —— 飞书多维表格字段捷径插件（FaaS 版）

## 功能简介

本插件是一个飞书多维表格的「字段捷径」插件，将九因科技的 AI 图片生成能力直接嵌入多维表格，实现**一次添加、自动运行**。

核心能力：
- 根据**文字提示词**自动生成 AI 图片
- 支持传入**参考图片**（图生图）
- 使用 **GPT Image 2** 模型生成高质量 AI 图片
- 支持自定义图片比例、分辨率与质量（低/中/高）
- 生成结果以**附件字段**形式直接写入多维表格

## 项目结构

```
├── config.json        # 本地调试授权配置
├── package.json       # 项目依赖与脚本
├── tsconfig.json      # TypeScript 配置
├── src/
│   └── index.ts       # 字段捷径主逻辑（表单、执行函数、返回类型）
└── dev/               # API 文档与开发参考
    ├── faas.md
    ├── 创建图片生成任务.md
    ├── 获取图片生成信息.md
    ├── 上传OSS对象存储.md
    └── 捷径字段开发.md
```

## 环境要求

- Node.js >= 14.16.0
- npm

## 本地开发调试

### 第一步：安装依赖

```bash
npm install
```

### 第二步：启动本地服务

```bash
npm run start
```

### 第三步：在飞书多维表格中调试

1. 基于 [FaaS 字段捷径调试模板](https://feishu.feishu.cn/base/DiQXbSLkSaGmwUsHkfJcAscunlh?table=tblwp5TejhYSjeNU&view=vewPbLApNL) 复制一份副本
2. 在侧边栏插件市场中搜索「字段捷径调试助手」，运行后 pin 到侧边栏
3. **确保本地服务已启动**，点击「打开面板」按钮，字段配置信息将显示在创建字段面板上
4. 选择必填字段后点击保存，创建调试字段
5. 选择该 FaaS 字段，点击「调试字段」，插件将模拟请求并写入结果

> 注意：调试阶段只会处理第一行记录。

## 使用说明

### 表单字段说明

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| OpenAPI Token | 文本输入 | 是 | 九因科技 OpenAPI Token，用于接口鉴权 |
| 提示词 | 文本输入 | 是 | 描述你想生成的图片内容 |
| 参考图片 | 附件字段 | 否 | 可选的参考图片，用于图生图模式 |
| 图片比例 | 单选 | 是 | 可选：1:1、1:3、3:1、3:4、4:3、9:16、16:9 |
| 分辨率 | 单选 | 是 | 可选：1K、2K、4K |
| 图片质量 | 单选 | 是 | 可选：低 (Low)、中 (Medium)、高 (High) |

### 执行流程

1. 用户填写提示词并配置参数
2. 若提供了参考图片，插件自动将图片上传到九因 OSS 获取 `ossId`
3. 调用九因 API `POST /unified/ai/openApi/image/create` 创建图片生成任务
4. 轮询 `GET /unified/ai/openApi/image/get` 获取任务状态（每 5 秒一次，最多 10 分钟）
5. 任务完成后，解析生成的图片 URL，以附件形式写入多维表格

### 返回结果

插件返回类型为**附件字段**，生成的图片将直接以附件形式显示在多维表格中，支持预览和下载。

## 打包发布

### 第一步：打包

在项目根目录执行（Node.js 版本 >= 14.16.0）：

```bash
npm run pack
```

执行后会在项目目录下生成 `output/output.zip` 文件。

### 第二步：上传

将 `output/output.zip` 上传到飞书多维表格捷径平台。

### 第三步：提交发布

上线需要将项目提交到 GitHub，然后填写 [多维表格捷径插件表单](https://feishu.feishu.cn/share/base/form/shrcnwTXnFVAbMPOSeaOFwIAnbf) 进行发布审核。

### 发布注意事项

- **执行方式**：建议选择**异步执行**模式（超时 15 分钟），因为 AI 生图耗时较长，同步模式仅 58 秒超时
- **域名白名单**：插件已声明 `ai-base.theninefactor.com` 和 `feishu.cn` 为白名单域名
- **OpenAPI Token**：用户在表单中直接填写九因 OpenAPI Token，无需额外授权配置
- **限流建议**：建议设置合理的并发数限制，避免超出九因 API 的调用配额

## 涉及的 API

| API | 方法 | 说明 |
| --- | --- | --- |
| `/resource/oss/openApi/upload` | POST | 上传参考图片到 OSS 对象存储 |
| `/unified/ai/openApi/image/create` | POST | 创建 AI 图片生成任务 |
| `/unified/ai/openApi/image/get` | GET | 获取图片生成任务状态与结果 |

API 基础地址：`https://ai-base.theninefactor.com`
