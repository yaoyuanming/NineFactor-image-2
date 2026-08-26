# POST 上传OSS对象存储

POST `/resource/oss/openApi/upload`

上传文件到OSS对象存储

## Body 请求参数

```
multipart/form-data
```

| 名称 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| file | file | 是 | 要上传的文件 |

## 请求参数

| 名称 | 位置 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- | --- |
| Authorization | header | string | 否 | none |
| clientid | header | string | 否 | none |
| Open-Api-Token | header | string | 否 | none |
| file | body | file | 是 | 要上传的文件 |

## 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "url": "string",
    "fileName": "string",
    "ossId": "string"
  }
}
```

## 返回结果

| 状态码 | 状态码含义 | 说明 | 数据模型 |
| --- | --- | --- | --- |
| 200 | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1) | 上传成功 | RSysOssUploadVo |
| 401 | [Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1) | 未授权 | string |

## 数据模型

### RSysOssUploadVo

响应结构

| 名称 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| code | integer(int32) | 是 | 消息状态码 |
| msg | string | 是 | 消息内容 |
| data | SysOssUploadVo | 否 | 数据对象 |

### SysOssUploadVo

OSS上传响应对象

| 名称 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| url | string | 是 | 文件URL地址 |
| fileName | string | 是 | 文件名 |
| ossId | string | 是 | 对象存储主键 |

