import {
  basekit,
  FieldType,
  field,
  FieldComponent,
  FieldCode,
} from '@lark-opdev/block-basekit-server-api';

const { t } = field;

// ========== 常量配置 ==========
const API_BASE = 'https://ai-base.theninefactor.com';
const MODEL = 'gemini-3.5-flash';

// ========== 域名白名单 ==========
basekit.addDomainList([
  'ai-test.theninefactor.com',
  'ai-base.theninefactor.com',
  "ai-base.yiguangshan.com",
  'ninefactory-test-open.oss-cn-beijing.aliyuncs.com',
  'open.feishu.cn',
  'internal-api-drive-stream.feishu.cn',
]);

// ========== 插件主体 ==========
basekit.addField({
  authorizations: [],

  // ========== 国际化 ==========
  i18n: {
    messages: {
      'zh-CN': {
        apiKeyLabel: '九因API key',
        systemPromptLabel: '系统提示词',
        systemPromptPlaceholder: '请输入系统提示词（设定AI角色与行为规则）',
        userPromptLabel: '对话提示词',
        userPromptPlaceholder: '请输入对话提示词（每次对话的用户消息）',
        imagesLabel: '参考图片',
        imagesPlaceholder: '选择图片附件字段（可选，可多选）',
        noApiKey: '请输入九因API key',
        noSystemPrompt: '请输入系统提示词',
        noUserPrompt: '请输入对话提示词',
        callFail: '对话请求失败',
        ossUploadFail: '图片上传OSS失败',
      },
      'en-US': {
        apiKeyLabel: '九因API key',
        systemPromptLabel: 'System Prompt',
        systemPromptPlaceholder: 'Enter system prompt (define AI role and behavior rules)',
        userPromptLabel: 'User Prompt',
        userPromptPlaceholder: 'Enter user prompt (message for each conversation)',
        imagesLabel: 'Reference Images',
        imagesPlaceholder: 'Select image attachment fields (optional, multiple select)',
        noApiKey: 'Please enter 九因API key',
        noSystemPrompt: 'Please enter system prompt',
        noUserPrompt: 'Please enter user prompt',
        callFail: 'Chat request failed',
        ossUploadFail: 'Image upload to OSS failed',
      },
      'ja-JP': {
        apiKeyLabel: '九因API key',
        systemPromptLabel: 'システムプロンプト',
        systemPromptPlaceholder: 'システムプロンプトを入力（AIの役割と動作ルールを設定）',
        userPromptLabel: 'ユーザープロンプト',
        userPromptPlaceholder: 'ユーザープロンプトを入力（会話のユーザーメッセージ）',
        imagesLabel: '参考画像',
        imagesPlaceholder: '画像添付フィールドを選択（オプション、複数選択可）',
        noApiKey: '九因API keyを入力してください',
        noSystemPrompt: 'システムプロンプトを入力してください',
        noUserPrompt: 'ユーザープロンプトを入力してください',
        callFail: 'チャットリクエストに失敗しました',
        ossUploadFail: '画像のOSSアップロードに失敗しました',
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
        placeholder: '请输入九因API key',
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'systemPrompt',
      label: t('systemPromptLabel'),
      component: FieldComponent.Input,
      props: {
        placeholder: t('systemPromptPlaceholder'),
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'userPrompt',
      label: t('userPromptLabel'),
      component: FieldComponent.Input,
      props: {
        placeholder: t('userPromptPlaceholder'),
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'images',
      label: t('imagesLabel'),
      component: FieldComponent.FieldSelect,
      props: {
        placeholder: t('imagesPlaceholder'),
        supportType: [FieldType.Attachment],
        mode: 'multiple',
      },
      validator: {
        required: false,
      },
    },
  ],

  // ========== 返回类型：多行文本字段 ==========
  resultType: {
    type: FieldType.Text,
  },

  // ========== 执行函数 ==========
  execute: async (formItemParams: any, context: any) => {
    const { apiKey, systemPrompt, userPrompt, images } = formItemParams;
    // images 为二维数组：每个选中的附件字段对应一个附件数组，需扁平化
    const allImages: any[] = [];
    if (images) {
      for (const fieldImages of images) {
        if (Array.isArray(fieldImages)) {
          allImages.push(...fieldImages);
        } else if (fieldImages) {
          allImages.push(fieldImages);
        }
      }
    }
    console.log('=== [Execute] Input params:', JSON.stringify({
      apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
      systemPrompt: systemPrompt?.substring(0, 50) + '...',
      userPrompt: userPrompt?.substring(0, 50) + '...',
      imageFieldsCount: Array.isArray(images) ? images.length : 0,
      totalImages: allImages.length,
    }));

    // 1. 校验参数
    if (!apiKey || !apiKey.trim()) {
      return {
        code: FieldCode.InvalidArgument,
        msg: t('noApiKey'),
      };
    }
    if (!userPrompt || !userPrompt.trim()) {
      return {
        code: FieldCode.InvalidArgument,
        msg: t('noUserPrompt'),
      };
    }

    const authHeader = { 'Open-Api-Token': apiKey.trim() };

    try {
      // 2. 处理图片附件：从多个附件字段收集所有图片，下载并上传到 OSS
      const imageUrls: string[] = [];
      if (allImages.length > 0) {
        console.log(`=== [OSS] Processing ${allImages.length} image(s) from multiple fields`);
        for (let i = 0; i < allImages.length; i++) {
          const img = allImages[i];
          console.log(`=== [OSS] Image ${i + 1}: name=${img.name}, size=${img.size}, type=${img.type}`);

          // 下载附件获取 buffer
          const imgRes = await context.fetch(img.tmp_url);
          if (!imgRes.ok) {
            console.error(`=== [OSS] Failed to download image ${i + 1}:`, imgRes.statusText);
            return { code: FieldCode.Error, msg: `${t('ossUploadFail')}: ${img.name}` };
          }
          const imgBuffer = await imgRes.buffer();

          // 构造 multipart/form-data 上传到 OSS
          const boundary = `----FormBoundary${Date.now()}${i}`;
          const imgBodyParts: string[] = [];
          imgBodyParts.push(`--${boundary}\r\n`);
          imgBodyParts.push(`Content-Disposition: form-data; name="file"; filename="${img.name}"\r\n`);
          imgBodyParts.push(`Content-Type: ${img.type || 'application/octet-stream'}\r\n\r\n`);
          const header = Buffer.from(imgBodyParts.join(''), 'utf-8');
          const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
          const uploadBody = Buffer.concat([header, imgBuffer, footer]);

          console.log(`=== [OSS] Uploading image ${i + 1} to OSS...`);
          const ossRes = await context.fetch(`${API_BASE}/resource/oss/openApi/upload`, {
            method: 'POST',
            headers: {
              ...authHeader,
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            body: uploadBody,
          });
          const ossData = await ossRes.json();
          console.log(`=== [OSS] Upload response ${i + 1}:`, JSON.stringify(ossData));

          if ((ossData.code !== 0 && ossData.code !== 200) || !ossData.data?.url) {
            console.error(`=== [OSS] Upload failed for image ${i + 1}:`, ossData.msg);
            return { code: FieldCode.Error, msg: `${t('ossUploadFail')}: ${ossData.msg || img.name}` };
          }
          imageUrls.push(ossData.data.url);
          console.log(`=== [OSS] Image ${i + 1} uploaded, URL: ${ossData.data.url}`);
        }
      }

      // 3. 构造对话请求
      const messages: any[] = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }

      // 构造 user message：有图片时用 content 数组（OpenAI vision 格式）
      if (imageUrls.length > 0) {
        const contentParts: any[] = [
          { type: 'text', text: userPrompt.trim() },
        ];
        for (const url of imageUrls) {
          contentParts.push({
            type: 'image_url',
            image_url: { url },
          });
        }
        messages.push({ role: 'user', content: contentParts });
      } else {
        messages.push({ role: 'user', content: userPrompt.trim() });
      }

      const requestBody: any = {
        model: MODEL,
        messages,
        stream: false,
      };

      console.log('=== [Chat] Request URL:', `${API_BASE}/unified/openApi/v1/chat/completions`);
      console.log('=== [Chat] Request Body:', JSON.stringify({
        ...requestBody,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: typeof m.content === 'string'
            ? m.content.substring(0, 100) + '...'
            : m.content.map((c: any) => c.type === 'text' ? { type: 'text', text: c.text.substring(0, 100) + '...' } : c),
        })),
      }));

      // 4. 发起对话请求
      const chatRes = await context.fetch(`${API_BASE}/unified/openApi/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(requestBody),
      });

      // 5. 解析响应（支持 SSE 流式和普通 JSON 两种格式）
      const responseText = await chatRes.text();
      console.log('=== [Chat] Response (first 500 chars):', responseText.substring(0, 500));

      let chatData: any = null;
      let replyContent = '';

      // 尝试解析为普通 JSON
      try {
        chatData = JSON.parse(responseText);
      } catch {
        // 非 JSON，尝试按 SSE 格式解析
        const lines = responseText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const chunk = JSON.parse(dataStr);
              const delta = chunk?.choices?.[0]?.delta?.content || chunk?.choices?.[0]?.message?.content;
              if (delta) {
                replyContent += delta;
              }
            } catch {
              // 忽略解析失败的行
            }
          }
        }
      }

      // 普通 JSON 响应处理
      if (chatData) {
        if (chatData.code !== undefined && chatData.code !== 200) {
          return {
            code: FieldCode.Error,
            msg: `${t('callFail')}: ${chatData.msg || 'unknown error'}`,
          };
        }
        replyContent = chatData?.choices?.[0]?.message?.content || chatData?.data?.content || '';
      }

      if (replyContent) {
        return {
          code: FieldCode.Success,
          data: replyContent,
        };
      }

      return {
        code: FieldCode.Error,
        msg: `${t('callFail')}: 响应中未包含有效内容`,
      };
    } catch (err: any) {
      console.error('===捷径执行异常:', err);
      return {
        code: FieldCode.Error,
        msg: `===捷径代码执行异常: ${err?.message || err}`
      };
    }
  },
});

export default basekit;
