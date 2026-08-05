import {
  basekit,
  FieldType,
  field,
  FieldComponent,
  FieldCode,
  AuthorizationType,
} from '@lark-opdev/block-basekit-server-api';

const { t } = field;

// ========== 常量配置 ==========
const API_BASE = 'https://ai-base.theninefactor.com';
const POLL_INTERVAL = 5000; // 轮询间隔 5 秒
const MAX_POLL_COUNT = 120; // 最多轮询 120 次（10 分钟）

// ========== 尺寸计算：比例 × 分辨率 → 像素尺寸 ==========
const SIZE_MAP: Record<string, Record<string, string>> = {
  '1:1':  { '1K': '1024x1024',  '2K': '2048x2048',  '4K': '4096x4096' },
  '1:3':  { '1K': '512x1536',   '2K': '1024x3072',  '4K': '2048x6144' },
  '3:1':  { '1K': '1536x512',   '2K': '3072x1024',  '4K': '6144x2048' },
  '3:4':  { '1K': '768x1024',   '2K': '1536x2048',  '4K': '3072x4096' },
  '4:3':  { '1K': '1024x768',   '2K': '2048x1536',  '4K': '4096x3072' },
  '9:16': { '1K': '576x1024',   '2K': '1152x2048',  '4K': '2304x4096' },
  '16:9': { '1K': '1024x576',   '2K': '2048x1152',  '4K': '4096x2304' },
};

function computeSize(ratio: string, resolution: string): string {
  return SIZE_MAP[ratio]?.[resolution] || '1024x1024';
}

// ========== 域名白名单 ==========
basekit.addDomainList([
  'ai-test.theninefactor.com',
  'ai-base.theninefactor.com',
  'ninefactory-test-open.oss-cn-beijing.aliyuncs.com',
  'open.feishu.cn',
  'internal-api-drive-stream.feishu.cn',
]);

// ========== 授权配置 ==========
basekit.addField({
  authorizations: [],

  // ========== 国际化 ==========
  i18n: {
    messages: {
      'zh-CN': {
        apiKeyLabel: '九因API key',
        promptLabel: '提示词',
        promptPlaceholder: '请输入图片描述/提示词',
        refImageLabel: '参考图片（可选）',
        aspectRatioLabel: '图片比例',
        resolutionLabel: '分辨率',
        qualityLabel: '图片质量',
        noPrompt: '请输入提示词',
        uploadFail: '参考图片上传失败',
        createFail: '创建图片生成任务失败',
        timeout: '图片生成超时，请稍后重试',
        generateFail: '图片生成失败',
      },
      'en-US': {
        apiKeyLabel: '九因API key',
        promptLabel: 'Prompt',
        promptPlaceholder: 'Enter image description / prompt',
        refImageLabel: 'Reference Image (optional)',
        aspectRatioLabel: 'Aspect Ratio',
        resolutionLabel: 'Resolution',
        qualityLabel: 'Quality',
        noPrompt: 'Please enter a prompt',
        uploadFail: 'Reference image upload failed',
        createFail: 'Failed to create image generation task',
        timeout: 'Image generation timed out, please retry',
        generateFail: 'Image generation failed',
      },
      'ja-JP': {
        apiKeyLabel: '九因API key',
        promptLabel: 'プロンプト',
        promptPlaceholder: '画像の説明/プロンプトを入力',
        refImageLabel: '参考画像（任意）',
        aspectRatioLabel: 'アスペクト比',
        resolutionLabel: '解像度',
        qualityLabel: '品質',
        noPrompt: 'プロンプトを入力してください',
        uploadFail: '参考画像のアップロードに失敗しました',
        createFail: '画像生成タスクの作成に失敗しました',
        timeout: '画像生成がタイムアウトしました',
        generateFail: '画像生成に失敗しました',
      },
    },
  },

  // ========== 表单 UI ==========
  formItems: [
    {
      key: 'apiKey',
      label: t('apiKeyLabel'),
      component: FieldComponent.Input,
      tooltips: [
        {
          type: 'text',
          content: '前往',
        },
        {
          type: 'link',
          text: '九因官网',
          link: 'https://ai.theninefactor.com/',
        },
        {
          type: 'text',
          content: '获取',
        },
      ],
      props: {
        placeholder: '请输入九因API Key',
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'prompt',
      label: t('promptLabel'),
      component: FieldComponent.Input,
      props: {
        placeholder: t('promptPlaceholder'),
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'refImage',
      label: t('refImageLabel'),
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Attachment],
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'aspectRatio',
      label: t('aspectRatioLabel'),
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: '1:1', value: '1:1' },
          { label: '1:3', value: '1:3' },
          { label: '3:1', value: '3:1' },
          { label: '3:4', value: '3:4' },
          { label: '4:3', value: '4:3' },
          { label: '9:16', value: '9:16' },
          { label: '16:9', value: '16:9' },
        ],
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'resolution',
      label: t('resolutionLabel'),
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: '1K', value: '1K' },
          { label: '2K', value: '2K' },
          { label: '4K', value: '4K' },
        ],
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'quality',
      label: t('qualityLabel'),
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: '低 (Low)', value: 'low' },
          { label: '中 (Medium)', value: 'medium' },
          { label: '高 (High)', value: 'high' },
        ],
      },
      validator: {
        required: true,
      },
    },
  ],

  // ========== 返回类型：附件字段 ==========
  resultType: {
    type: FieldType.Attachment,
  },

  // ========== 执行函数 ==========
  execute: async (formItemParams: any, context: any) => {
    const { apiKey, prompt, refImage, aspectRatio, resolution, quality } = formItemParams;
    console.log('=== [Execute] Input params:', JSON.stringify({
      apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
      prompt: prompt?.trim(),
      refImage: refImage?.length || 0,
      aspectRatio: aspectRatio?.value,
      resolution: resolution?.value,
      quality: quality?.value,
    }));

    // 根据比例和分辨率计算实际像素尺寸
    const size = computeSize(aspectRatio?.value || '1:1', resolution?.value || '1K');

    // 1. 校验参数
    if (!apiKey || !apiKey.trim()) {
      return {
        code: FieldCode.InvalidArgument,
        msg: '请输入九因API key',
      };
    }
    if (!prompt || !prompt.trim()) {
      return {
        code: FieldCode.InvalidArgument,
        msg: t('noPrompt'),
      };
    }

    const authHeader = { 'Open-Api-Token': apiKey.trim() };

    try {
      // 2. 上传参考图片到 OSS（如果有）
      let imgOssId: string | null = null;
      let imgUrl: string | null = null;
      if (refImage && refImage.length > 0 && refImage[0].tmp_url) {
        const ossResult = await uploadImageToOss(refImage[0], context, apiKey.trim());
        if (!ossResult) {
          return {
            code: FieldCode.Error,
            msg: t('uploadFail'),
          };
        }
        imgOssId = ossResult.ossId;
        imgUrl = ossResult.url;
      }

      // 3. 创建图片生成任务
      const createBody: any = {
        text: prompt.trim(),
        model: 'gpt-image-2',
        size: size,
        quality: quality?.value || 'medium',
      };
      if (imgOssId) {
        createBody.imgOssId = imgOssId;
      }
      if (imgUrl) {
        createBody.imgUrl = imgUrl;
      }

      console.log('=== [Create Task] Request URL:', `${API_BASE}/unified/ai/openApi/image/create`);
      console.log('=== [Create Task] Request Body:', JSON.stringify(createBody));
      const createRes = await context.fetch(`${API_BASE}/unified/ai/openApi/image/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(createBody),
      });
      const createData = await createRes.json();
      console.log('=== [Create Task] Response:', JSON.stringify(createData));
      if (createData.code !== 200 || !createData.data?.id) {
        return {
          code: FieldCode.Error,
          msg: `${t('createFail')}: ${createData.msg || 'unknown error'}`,
        };
      }

      const taskId = createData.data.id;
      console.log(`Task created, id: ${taskId}`);

      // 4. 轮询获取生成结果
      const taskResult = await pollTaskResult(taskId, context, authHeader);
      if (!taskResult) {
        return {
          code: FieldCode.Error,
          msg: t('timeout'),
        };
      }

      // 5. 解析生成的图片 URL
      const imagesUrl: string = taskResult.imagesUrl;
      if (!imagesUrl) {
        return {
          code: FieldCode.Error,
          msg: t('generateFail'),
        };
      }

      // imagesUrl 可能是 JSON 数组字符串或逗号分隔的字符串
      let urls: string[];
      try {
        const parsed = JSON.parse(imagesUrl);
        urls = Array.isArray(parsed) ? parsed : [imagesUrl];
      } catch {
        urls = imagesUrl.split(',').map((u: string) => u.trim()).filter(Boolean);
      }

      // 6. 构造附件返回数据
      console.log('=== Generated URLs:', JSON.stringify(urls));
      const attachments = urls.map((url: string, index: number) => ({
        name: `generated_image_${index + 1}.png`,
        content: url,
        contentType: 'attachment/url' as const,
      }));
      console.log('=== Returning attachments:', JSON.stringify(attachments));

      return {
        code: FieldCode.Success,
        data: attachments,
      };
    } catch (err: any) {
      console.error('===捷径执行异常:', err);
      return {
        code: FieldCode.Error,
        msg: `===捷径代码执行异常: ${err?.message || err}`,
      };
    }
  },
});

// ========== 辅助函数：上传图片到 OSS ==========
async function uploadImageToOss(
  attachment: { tmp_url: string; name: string; type?: string },
  context: any,
  apiKey: string
): Promise<{ ossId: string; url: string } | null> {
  try {
    // 下载附件
    const fileRes = await context.fetch(attachment.tmp_url);
    if (!fileRes.ok) {
      console.error('Download attachment failed:', fileRes.status);
      return null;
    }
    const buffer = await fileRes.buffer();

    // 构造 multipart/form-data
    const boundary = '----NineFactorFormBoundary' + Date.now().toString(36);
    const fileName = attachment.name || 'image.png';
    const mimeType = attachment.type || 'image/png';

    const head = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([head, buffer, tail]);

    // 上传到 OSS
    console.log('=== [OSS Upload] Request:', attachment.tmp_url);
    const uploadRes = await context.fetch(`${API_BASE}/resource/oss/openApi/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Open-Api-Token': apiKey,
      },
      body: body,
    });
    const uploadData = await uploadRes.json();
    console.log('=== [OSS Upload] Response:', JSON.stringify(uploadData));
    if (uploadData.code === 200 && uploadData.data?.ossId) {
      console.log('Upload OSS success, ossId:', uploadData.data.ossId, 'url:', uploadData.data.url);
      return { ossId: uploadData.data.ossId, url: uploadData.data.url };
    }

    console.error('Upload OSS failed:', uploadData);
    return null;
  } catch (err: any) {
    console.error('Upload OSS error:', err);
    return null;
  }
}

// ========== 辅助函数：轮询任务结果 ==========
async function pollTaskResult(
  taskId: string,
  context: any,
  authHeader: Record<string, string>
): Promise<any | null> {
  for (let i = 0; i < MAX_POLL_COUNT; i++) {
    // 等待轮询间隔
    await sleep(POLL_INTERVAL);

    try {
      console.log(`=== [Poll] Attempt ${i + 1}: GET ${API_BASE}/unified/ai/openApi/image/get?id=${encodeURIComponent(taskId)}`);
      const res = await context.fetch(
        `${API_BASE}/unified/ai/openApi/image/get?id=${encodeURIComponent(taskId)}`,
        { method: 'GET', headers: authHeader },
      );
      const data = await res.json();
      console.log(`=== [Poll] Attempt ${i + 1}: Response =`, JSON.stringify(data));

      if (data.code !== 200) {
        console.log(`Poll attempt ${i + 1}: API returned code ${data.code}, msg: ${data.msg}`);
        continue;
      }

      const taskInfo = data.data;
      const status = taskInfo?.status;
      console.log(`Poll attempt ${i + 1}: status = ${status}`);

      // 判断任务完成状态
      if (status === 'succeeded') {
        return taskInfo;
      }
      if (status === 'failed') {
        console.error('Task failed:', taskInfo?.failReason);
        return null;
      }
      // running / queued 继续轮询
    } catch (err: any) {
      console.error(`Poll attempt ${i + 1} error:`, err);
    }
  }

  // 超时
  return null;
}

// ========== 辅助函数：sleep ==========
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default basekit;
