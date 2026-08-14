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
const MODEL = 'gpt-5.6-terra';

// ========== 域名白名单 ==========
basekit.addDomainList([
  'ai-test.theninefactor.com',
  'ai-base.theninefactor.com',
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
        noApiKey: '请输入九因API key',
        noSystemPrompt: '请输入系统提示词',
        noUserPrompt: '请输入对话提示词',
        callFail: '对话请求失败',
      },
      'en-US': {
        apiKeyLabel: '九因API key',
        systemPromptLabel: 'System Prompt',
        systemPromptPlaceholder: 'Enter system prompt (define AI role and behavior rules)',
        userPromptLabel: 'User Prompt',
        userPromptPlaceholder: 'Enter user prompt (message for each conversation)',
        noApiKey: 'Please enter 九因API key',
        noSystemPrompt: 'Please enter system prompt',
        noUserPrompt: 'Please enter user prompt',
        callFail: 'Chat request failed',
      },
      'ja-JP': {
        apiKeyLabel: '九因API key',
        systemPromptLabel: 'システムプロンプト',
        systemPromptPlaceholder: 'システムプロンプトを入力（AIの役割と動作ルールを設定）',
        userPromptLabel: 'ユーザープロンプト',
        userPromptPlaceholder: 'ユーザープロンプトを入力（会話のユーザーメッセージ）',
        noApiKey: '九因API keyを入力してください',
        noSystemPrompt: 'システムプロンプトを入力してください',
        noUserPrompt: 'ユーザープロンプトを入力してください',
        callFail: 'チャットリクエストに失敗しました',
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
  ],

  // ========== 返回类型：多行文本字段 ==========
  resultType: {
    type: FieldType.Text,
  },

  // ========== 执行函数 ==========
  execute: async (formItemParams: any, context: any) => {
    const { apiKey, systemPrompt, userPrompt } = formItemParams;
    console.log('=== [Execute] Input params:', JSON.stringify({
      apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
      systemPrompt: systemPrompt?.substring(0, 50) + '...',
      userPrompt: userPrompt?.substring(0, 50) + '...',
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
      // 2. 构造对话请求
      const messages: any[] = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }
      messages.push({
        role: 'user',
        content: userPrompt.trim(),
      });

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
          content: m.content.substring(0, 100) + '...',
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
