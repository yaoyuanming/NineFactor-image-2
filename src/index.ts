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
const MODEL = 'doubao-seedance-2-5-260628';

// ========== 域名白名单 ==========
basekit.addDomainList([
  'ai-test.theninefactor.com',
  'ai-base.theninefactor.com',
  "ai-base.yiguangshan.com",
  'ninefactory-test-open.oss-cn-beijing.aliyuncs.com',
  'open.feishu.cn',
  'internal-api-drive-stream.feishu.cn',
]);

// ========== 轮询配置 ==========
const POLL_INTERVAL_MS = 5000;   // 每5秒轮询一次
const MAX_POLL_COUNT = 120;      // 最多轮询120次（共10分钟）

// ========== 插件主体 ==========
basekit.addField({
  authorizations: [],

  // ========== 国际化 ==========
  i18n: {
    messages: {
      'zh-CN': {
        apiKeyLabel: '九因API key',
        textLabel: '提示文本',
        textPlaceholder: '请输入视频生成的提示文本描述',
        durationLabel: '视频时长（秒）',
        durationPlaceholder: '请输入视频持续时间（秒）',
        aspectRatioLabel: '画面比例',
        aspectRatioPlaceholder: '请选择画面比例（如 16:9、9:16、1:1）',
        resolutionLabel: '视频分辨率',
        resolutionPlaceholder: '请输入视频分辨率（如 480p、720p）',
        imagesLabel: '参考图片附件',
        imagesPlaceholder: '选择图片附件字段（可选，作为参考图）',
        referenceVideoLabel: '参考视频附件',
        referenceVideoPlaceholder: '选择视频附件字段（可选，作为参考视频）',
        generateAudioLabel: '输出声音',
        noApiKey: '请输入九因API key',
        noText: '请输入提示文本',
        noDuration: '请输入视频时长',
        callFail: '视频生成请求失败',
        ossUploadFail: '图片上传OSS失败',
        taskTimeout: '视频生成任务超时未完成',
        taskFailed: '视频生成失败',
      },
      'en-US': {
        apiKeyLabel: '九因API key',
        textLabel: 'Prompt Text',
        textPlaceholder: 'Enter prompt text for video generation',
        durationLabel: 'Duration (seconds)',
        durationPlaceholder: 'Enter video duration in seconds',
        aspectRatioLabel: 'Aspect Ratio',
        aspectRatioPlaceholder: 'Select aspect ratio (e.g. 16:9, 9:16, 1:1)',
        resolutionLabel: 'Resolution',
        resolutionPlaceholder: 'Enter video resolution (e.g. 480p, 720p)',
        imagesLabel: 'Reference Image Attachments',
        imagesPlaceholder: 'Select image attachment field (optional, as reference image)',
        referenceVideoLabel: 'Reference Video Attachments',
        referenceVideoPlaceholder: 'Select video attachment field (optional, as reference video)',
        generateAudioLabel: 'Output Audio',
        noApiKey: 'Please enter 九因API key',
        noText: 'Please enter prompt text',
        noDuration: 'Please enter video duration',
        callFail: 'Video generation request failed',
        ossUploadFail: 'Image upload to OSS failed',
        taskTimeout: 'Video generation task timed out',
        taskFailed: 'Video generation failed',
      },
      'ja-JP': {
        apiKeyLabel: '九因API key',
        textLabel: 'プロンプトテキスト',
        textPlaceholder: '動画生成のプロンプトテキストを入力',
        durationLabel: '動画長さ（秒）',
        durationPlaceholder: '動画の長さを入力（秒）',
        aspectRatioLabel: 'アスペクト比',
        aspectRatioPlaceholder: 'アスペクト比を選択（例: 16:9、9:16、1:1）',
        resolutionLabel: '解像度',
        resolutionPlaceholder: '動画解像度を入力（例: 480p、720p）',
        imagesLabel: '参考画像添付',
        imagesPlaceholder: '画像添付フィールドを選択（オプション、参考画像として使用）',
        referenceVideoLabel: '参考動画添付',
        referenceVideoPlaceholder: '動画添付フィールドを選択（オプション、参考動画として使用）',
        generateAudioLabel: 'オーディオ出力',
        noApiKey: '九因API keyを入力してください',
        noText: 'プロンプトテキストを入力してください',
        noDuration: '動画の長さを入力してください',
        callFail: '動画生成リクエストに失敗しました',
        ossUploadFail: '画像のOSSアップロードに失敗しました',
        taskTimeout: '動画生成タスクがタイムアウトしました',
        taskFailed: '動画生成に失敗しました',
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
      key: 'text',
      label: t('textLabel'),
      component: FieldComponent.Input,
      props: {
        placeholder: t('textPlaceholder'),
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'duration',
      label: t('durationLabel'),
      component: FieldComponent.Radio,
      props: {
        options: [
          { label: '智能时长', value: '-1' },
          { label: '5秒', value: '5' },
          { label: '10秒', value: '10' },
          { label: '15秒', value: '15' },
        ],
      },
      defaultValue: '-1',
      validator: {
        required: true,
      },
    },
    {
      key: 'aspectRatio',
      label: t('aspectRatioLabel'),
      component: FieldComponent.Radio,
      props: {
        options: [
          { label: '智能', value: 'adaptive' },
          { label: '1:1', value: '1:1' },
          { label: '3:4', value: '3:4' },
          { label: '4:3', value: '4:3' },
          { label: '9:16', value: '9:16' },
          { label: '16:9', value: '16:9' },
          { label: '21:9', value: '21:9' },
        ],
      },
      defaultValue: 'adaptive',
      validator: {
        required: false,
      },
    },
    {
      key: 'resolution',
      label: t('resolutionLabel'),
      component: FieldComponent.Radio,
      props: {
        options: [
          { label: '480p', value: '480p' },
          { label: '720p', value: '720p' },
        ],
      },
      defaultValue: '480p',
      validator: {
        required: false,
      },
    },
    {
      key: 'images',
      label: t('imagesLabel'),
      component: FieldComponent.FieldSelect,
      props: {
        placeholder: t('imagesPlaceholder'),
        supportType: [FieldType.Attachment],
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'referenceVideo',
      label: t('referenceVideoLabel'),
      component: FieldComponent.FieldSelect,
      props: {
        placeholder: t('referenceVideoPlaceholder'),
        supportType: [FieldType.Attachment],
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'generateAudio',
      label: t('generateAudioLabel'),
      component: FieldComponent.Radio,
      props: {
        options: [
          { label: '是', value: 'true' },
          { label: '否', value: 'false' },
        ],
      },
      defaultValue: 'true',
      validator: {
        required: false,
      },
    },
  ],

  // ========== 返回类型：附件字段 ==========
  resultType: {
    type: FieldType.Attachment,
  },

  // ========== 执行函数 ==========
  execute: async (formItemParams: any, context: any) => {
    const { apiKey, text, duration, aspectRatio, resolution, images, referenceVideo, generateAudio } = formItemParams;
    // Radio 组件返回 {label, value} 对象，需提取 value
    const durationVal = duration?.value ?? duration;
    const aspectRatioVal = aspectRatio?.value ?? aspectRatio;
    const resolutionVal = resolution?.value ?? resolution;
    const generateAudioVal = generateAudio?.value ?? generateAudio;
    console.log('=== [Execute] Input params:', JSON.stringify({
      apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
      model: MODEL,
      text: text?.substring(0, 100) + '...',
      duration: durationVal,
      aspectRatio: aspectRatioVal,
      resolution: resolutionVal,
      imagesCount: images?.length || 0,
      referenceVideoCount: referenceVideo?.length || 0,
      generateAudio: generateAudioVal,
    }));

    // 1. 校验参数
    if (!apiKey || !apiKey.trim()) {
      return { code: FieldCode.InvalidArgument, msg: t('noApiKey') };
    }
    if (!text || !text.trim()) {
      return { code: FieldCode.InvalidArgument, msg: t('noText') };
    }
    if (!durationVal || (durationVal !== '-1' && isNaN(Number(durationVal)))) {
      return { code: FieldCode.InvalidArgument, msg: t('noDuration') };
    }

    const authHeader = { 'Open-Api-Token': apiKey.trim() };

    try {
      // 2. 处理图片附件：下载并上传到 OSS
      let imgUrl = '';
      let imgOssId = '';
      if (images && images.length > 0) {
        console.log(`=== [OSS-Img] Processing ${images.length} image attachment(s)`);
        const img = images[0];
        console.log(`=== [OSS-Img] Image 1: name=${img.name}, size=${img.size}, type=${img.type}`);

        const imgRes = await context.fetch(img.tmp_url);
        if (!imgRes.ok) {
          console.error(`=== [OSS-Img] Failed to download image:`, imgRes.statusText);
          return { code: FieldCode.Error, msg: `${t('ossUploadFail')}: ${img.name}` };
        }
        const imgBuffer = await imgRes.buffer();

        const boundary = `----FormBoundary${Date.now()}`;
        const imgBodyParts: string[] = [];
        imgBodyParts.push(`--${boundary}\r\n`);
        imgBodyParts.push(`Content-Disposition: form-data; name="file"; filename="${img.name}"\r\n`);
        imgBodyParts.push(`Content-Type: ${img.type || 'application/octet-stream'}\r\n\r\n`);
        const header = Buffer.from(imgBodyParts.join(''), 'utf-8');
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
        const uploadBody = Buffer.concat([header, imgBuffer, footer]);

        console.log(`=== [OSS-Img] Uploading image to OSS...`);
        const ossRes = await context.fetch(`${API_BASE}/resource/oss/openApi/upload`, {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body: uploadBody,
        });
        const ossData = await ossRes.json();
        console.log(`=== [OSS-Img] Upload response:`, JSON.stringify(ossData));

        if ((ossData.code !== 0 && ossData.code !== 200) || !ossData.data?.url) {
          console.error(`=== [OSS-Img] Upload failed:`, ossData.msg);
          return { code: FieldCode.Error, msg: `${t('ossUploadFail')}: ${ossData.msg || img.name}` };
        }
        imgUrl = ossData.data.url;
        imgOssId = ossData.data.ossId || '';
        console.log(`=== [OSS-Img] Image uploaded, URL: ${imgUrl}, ossId: ${imgOssId}`);
      }

      // 2b. 处理视频附件：下载并上传到 OSS
      let contentVideoUrl = '';
      if (referenceVideo && referenceVideo.length > 0) {
        console.log(`=== [OSS-Video] Processing ${referenceVideo.length} video attachment(s)`);
        const vid = referenceVideo[0];
        console.log(`=== [OSS-Video] Video 1: name=${vid.name}, size=${vid.size}, type=${vid.type}`);

        const vidRes = await context.fetch(vid.tmp_url);
        if (!vidRes.ok) {
          console.error(`=== [OSS-Video] Failed to download video:`, vidRes.statusText);
          return { code: FieldCode.Error, msg: `${t('ossUploadFail')}: ${vid.name}` };
        }
        const vidBuffer = await vidRes.buffer();

        const boundary = `----FormBoundary${Date.now()}`;
        const vidBodyParts: string[] = [];
        vidBodyParts.push(`--${boundary}\r\n`);
        vidBodyParts.push(`Content-Disposition: form-data; name="file"; filename="${vid.name}"\r\n`);
        vidBodyParts.push(`Content-Type: ${vid.type || 'application/octet-stream'}\r\n\r\n`);
        const header = Buffer.from(vidBodyParts.join(''), 'utf-8');
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
        const uploadBody = Buffer.concat([header, vidBuffer, footer]);

        console.log(`=== [OSS-Video] Uploading video to OSS...`);
        const ossRes = await context.fetch(`${API_BASE}/resource/oss/openApi/upload`, {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body: uploadBody,
        });
        const ossData = await ossRes.json();
        console.log(`=== [OSS-Video] Upload response:`, JSON.stringify(ossData));

        if ((ossData.code !== 0 && ossData.code !== 200) || !ossData.data?.url) {
          console.error(`=== [OSS-Video] Upload failed:`, ossData.msg);
          return { code: FieldCode.Error, msg: `${t('ossUploadFail')}: ${ossData.msg || vid.name}` };
        }
        contentVideoUrl = ossData.data.url;
        console.log(`=== [OSS-Video] Video uploaded, URL: ${contentVideoUrl}`);
      }

      // 3. 构造视频生成请求
      const dur = Number(durationVal);
      const requestBody: any = {
        model: MODEL,
        text: text.trim(),
        duration: dur === -1 ? -1 : dur,
      };

      if (aspectRatioVal && aspectRatioVal !== 'adaptive') {
        requestBody.aspectRatio = aspectRatioVal;
      }
      if (resolutionVal) {
        requestBody.resolution = resolutionVal;
      }
      if (imgUrl) {
        requestBody.imgUrl = imgUrl;
      }
      if (imgOssId) {
        requestBody.imgOssId = imgOssId;
      }
      if (contentVideoUrl) {
        requestBody.contentVideo = contentVideoUrl;
      }
      if (generateAudioVal === 'true') {
        requestBody.generateAudio = true;
      }

      console.log('=== [Create Task] Request URL:', `${API_BASE}/unified/ai/openApi/video/create`);
      console.log('=== [Create Task] Request Body:', JSON.stringify(requestBody));

      // 4. 创建视频生成任务
      const createRes = await context.fetch(`${API_BASE}/unified/ai/openApi/video/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(requestBody),
      });
      const createData = await createRes.json();
      console.log('=== [Create Task] Response:', JSON.stringify(createData));

      if ((createData.code !== 0 && createData.code !== 200) || !createData.data?.id) {
        return {
          code: FieldCode.Error,
          msg: `${t('callFail')}: ${createData.msg || 'unknown error'}`,
        };
      }

      const taskId = createData.data.id;
      console.log(`=== [Create Task] Task created, id: ${taskId}`);

      // 5. 轮询任务状态
      let videoUrl = '';
      let taskStatus = '';
      for (let i = 0; i < MAX_POLL_COUNT; i++) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

        const pollUrl = `${API_BASE}/unified/ai/openApi/video/get?id=${taskId}`;
        console.log(`=== [Poll] Poll #${i + 1}: GET ${pollUrl}`);

        const pollRes = await context.fetch(pollUrl, {
          method: 'GET',
          headers: { ...authHeader },
        });
        const pollData = await pollRes.json();
        console.log(`=== [Poll] Poll #${i + 1} Response:`, JSON.stringify(pollData));

        if ((pollData.code !== 0 && pollData.code !== 200) || !pollData.data) {
          console.error(`=== [Poll] Poll failed:`, pollData.msg);
          continue;
        }

        taskStatus = pollData.data.status;
        console.log(`=== [Poll] Task status: ${taskStatus}, progress: ${pollData.data.progress}%`);

        if (taskStatus === 'succeeded') {
          videoUrl = pollData.data.videoUrl || '';
          console.log(`=== [Generated URL] videoUrl: ${videoUrl}`);
          break;
        }

        if (taskStatus === 'failed') {
          const failReason = pollData.data.failReason || 'unknown';
          console.error(`=== [Poll] Task failed: ${failReason}`);
          return {
            code: FieldCode.Error,
            msg: `${t('taskFailed')}: ${failReason}`,
          };
        }

        // running / queued → 继续轮询
      }

      if (!videoUrl && taskStatus !== 'succeeded') {
        return {
          code: FieldCode.Error,
          msg: t('taskTimeout'),
        };
      }

      if (videoUrl) {
        return {
          code: FieldCode.Success,
          data: [
            {
              name: 'video.mp4',
              content: videoUrl,
              contentType: 'attachment/url',
            },
          ],
        };
      }

      return {
        code: FieldCode.Error,
        msg: `${t('callFail')}: 响应中未包含有效视频URL`,
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
