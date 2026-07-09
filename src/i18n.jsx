import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applySiteName } from './site-config.js';

export const DEFAULT_LOCALE = 'zh-CN';
export const EN_LOCALE = 'en-US';
export const ZH_TW_LOCALE = 'zh-TW';
export const JA_LOCALE = 'ja-JP';

const LOCALES = {
  'zh-CN': {
    path: '',
    htmlLang: 'zh-CN',
    name: '简体中文',
    short: '简',
    switchLabel: '语言'
  },
  'zh-TW': {
    path: 'zh-tw',
    htmlLang: 'zh-Hant',
    name: '繁體中文',
    short: '繁',
    switchLabel: '語言'
  },
  'ja-JP': {
    path: 'ja',
    htmlLang: 'ja',
    name: '日本語',
    short: 'JP',
    switchLabel: '言語'
  },
  'en-US': {
    path: 'en',
    htmlLang: 'en',
    name: 'English',
    short: 'EN',
    switchLabel: 'lang'
  }
};

const LOCALE_ORDER = [DEFAULT_LOCALE, ZH_TW_LOCALE, JA_LOCALE, EN_LOCALE];

const messages = {
  'zh-CN': {
    nav: {
      home: '首页',
      webrtc: 'WebRTC',
      latency: '延迟',
      cdn: 'CDN',
      dns: 'DNS',
      status: '状态',
      api: 'API',
      navigation: '页面导航',
      homeAria: 'Chitanda IP 首页',
      switchLanguage: '切换语言',
      refresh: '刷新',
      refreshStatus: '刷新状态',
      rerun: '重新检测'
    },
    common: {
      loading: '加载中',
      reload: '重新加载',
      retry: '重试',
      waiting: '等待',
      compared: '已对比',
      copied: '已复制',
      copyIp: '复制 IP',
      clickCopyIp: '点击复制 IP',
      detect: '检测中',
      ready: '已获取',
      failed: '失败',
      pending: '待检测',
      unknown: '未知',
      unknownLocation: '未知位置',
      noLocation: '暂无位置',
      unknownNetwork: '未知网络',
      noNetwork: '暂无运营商',
      unavailable: '不可用',
      timeout: '超时',
      complete: '完成',
      count: '{count} 个',
      rows: '{count} 条',
      waitingDetect: '等待检测',
      noResult: '暂无结果',
      realtime: '实时更新'
    },
    home: {
      welcome: 'IP へようこそ',
      lead: '国内・境外・Google・独立检测，一屏查看不同网站看到的 IP。',
      viewResults: '查看结果',
      apiDocs: 'API 文档',
      liveCheck: '访问检测',
      liveCheckCopy: '四个项目同时检测，下面的信息来自你的浏览器访问结果。'
    },
    probe: {
      localTitle: '国内访问',
      localShort: '国内',
      localDescription: '访问国内网站时显示的 IP 地址。',
      internationalTitle: '境外访问',
      internationalShort: '境外',
      internationalDescription: '访问境外网站时显示的 IP 地址。',
      googleTitle: 'Google 访问',
      googleShort: 'Google',
      googleDescription: '访问 Google 相关服务时显示的 IP 地址。',
      defaultTitle: '独立检测',
      defaultShort: '独立',
      defaultDescription: '访问独立检测入口时显示的 IP 地址。',
      missingIp: '未获取到',
      location: '位置',
      network: '网络',
      timezone: '时区'
    },
    verdict: {
      title: '访问对比',
      unknownLabel: '等待检测',
      unknownSummary: '独立检测结果返回后会自动对比。',
      localLabel: '与国内访问一致',
      localSummary: '独立检测与国内访问看到的是同一个 IP。',
      remoteLabel: '与境外访问一致',
      remoteSummary: '独立检测与境外访问看到的是同一个 IP。',
      mixedLabel: '访问结果不同',
      mixedSummary: '几个网站看到的 IP 暂不一致。'
    },
    lookup: {
      title: 'IP 查询',
      subtitle: '归属信息',
      ipAddress: 'IP 地址',
      placeholder: '输入 IPv4 或 IPv6',
      button: '查询',
      emptyMessage: '请输入 IPv4 或 IPv6 地址。',
      invalidMessage: 'IP 地址无效，请输入正确的 IPv4 或 IPv6。',
      backHome: '返回首页',
      resultTitle: '查询结果',
      inputTitle: '输入 IP 地址',
      querying: '查询中',
      invalidTitle: 'IP 地址无效',
      notFoundTitle: '未查询到结果',
      notFoundCopy: '没有查询到这个 IP 的归属信息。',
      copiedHint: '点击 IP 地址可复制',
      countryCode: '国家代码',
      organization: '机构',
      coordinate: '坐标'
    },
    map: {
      online: '在线地图',
      googleBadge: 'Google 地图',
      tencentName: '腾讯位置服务',
      domesticBadge: '国内地图',
      domesticChecking: '国内地图 · 检测中',
      domesticBackup: '国内备用',
      globalBackup: '全球备用',
      backup: '备用地图',
      tencentAria: '腾讯地图位置',
      unavailable: '地图暂时不可用',
      loading: '地图加载中',
      googleTitle: 'Google 地图位置',
      bingTitle: 'Bing 地图位置'
    },
    api: {
      title: 'API 文档',
      pageTitle: 'API 文档 - Chitanda IP',
      heroCopy: '稳定、简洁的 IP 归属地接口，适合脚本、监控、网站和内部工具直接调用。',
      endpointsAria: 'API 端点',
      responseFields: '返回字段',
      terminalAria: '{label} SSH 示例',
      visitor: '当前访问者',
      visitorDescription: '返回当前请求来源 IP 的地理位置、ASN、运营商和坐标。',
      lookup: '指定 IP 查询',
      lookupDescription: '查询任意 IPv4 或 IPv6 地址，中文请求会优化中国大陆省市和运营商。',
      myip: '纯 IP 回显',
      myipDescription: '只返回当前访问者 IP。命令行可直接 curl 根域名，程序调用可使用 format=text。',
      health: '服务健康',
      healthDescription: '返回服务可用状态，用于监控源站和边缘连通性。',
      identity: '身份',
      location: '位置',
      network: '网络',
      time: '时间',
      target: '查询目标',
      localization: '本地化',
      textResponse: '文本响应',
      useCases: '使用场景',
      healthStatus: '健康状态',
      monitoring: '监控建议',
      fieldVisitorIp: '本次请求解析出的访问者 IP',
      fieldContinent: '洲代码',
      fieldCountry: '国家或地区及 ISO 代码',
      fieldRegion: '省市或地区信息',
      fieldCoordinate: '地图定位坐标',
      fieldAsn: '自治系统编号与组织',
      fieldIsp: '运营商或网络组织',
      fieldTimezone: '时区与 UTC 偏移',
      fieldPathIp: '路径中传入的 IPv4 或 IPv6 地址',
      fieldAcceptLanguage: '中文请求会返回中文地区、时区和组织别名',
      fieldBody: '纯文本 IP 地址，没有 JSON 包装',
      fieldShell: '脚本里快速读取出口 IP',
      fieldProbe: '轻量连通性探针',
      fieldOk: '服务是否正常响应',
      fieldOpenedAt: '当前服务进程启动时间',
      fieldHttp200: '可作为外部监控的成功条件',
      fieldBodyOk: 'JSON 字段可作为二次校验'
    },
    routeError: {
      title: '页面加载失败',
      copy: '当前页面资源加载失败，请刷新后重试。'
    },
    errorPage: {
      forbiddenPageTitle: '403 访问被拒绝 - Chitanda IP',
      notFoundPageTitle: '404 页面不存在 - Chitanda IP',
      forbiddenKicker: '403 Forbidden',
      notFoundKicker: '404 Not Found',
      forbiddenTitle: '访问被拒绝',
      notFoundTitle: '页面不存在',
      forbiddenCopy: '当前请求没有权限访问这个页面或资源。你可以返回首页，或查看服务状态和 API 文档。',
      notFoundCopy: '这个地址没有对应的页面。可能是链接已过期，或者路径输入有误。',
      homeAction: '返回首页',
      apiAction: 'API 文档',
      statusAction: '服务状态'
    },
    webrtc: {
      pageTitle: 'WebRTC IP 检测 - Chitanda IP',
      heroTitle: 'WebRTC IP 检测',
      heroCopy: '通过多组 STUN 节点查看浏览器能返回的公网候选 IP。',
      start: '开始检测',
      rerun: '重新检测',
      httpsExit: 'HTTPS 出口',
      stunPublicIp: 'STUN 公网 IP',
      domesticStun: '国内 STUN',
      globalStun: '全球 STUN',
      fetching: '获取中',
      notDetected: '未检测',
      probing: '探测中',
      pendingCount: '{count} 个待测',
      noticeRunningTitle: '正在检测 WebRTC IP',
      noticeRunningCopy: '正在等待 STUN 节点返回结果。',
      noticeFailedTitle: '检测失败',
      noticeFailedCopy: 'WebRTC 检测没有完成。',
      noticeUnsupportedTitle: '浏览器不支持 WebRTC',
      noticeUnsupportedCopy: '当前浏览器无法运行 RTCPeerConnection 探测。',
      noticeEmptyTitle: '未检测到公网 IP',
      noticeEmptyCopy: '没有从 STUN 候选中拿到公网地址。',
      noticeDetectedTitle: '检测到 {count} 个 WebRTC 公网 IP',
      noticeDetectedCopy: '各 STUN 节点已按行列出。',
      results: '检测结果',
      public: '公网 (STUN)',
      relay: '中继 (TURN)',
      peer: '对等反射',
      host: '本地候选',
      candidate: '候选地址',
      domestic: '国内',
      global: '全球',
      node: '节点',
      state: '状态',
      detected: '已检测到',
      notFound: '未检测到',
      noResponse: '未响应',
      unsupported: '不支持'
    },
    latency: {
      pageTitle: '延迟测试 - Chitanda IP',
      heroTitle: '浏览器延迟测试',
      heroCopy: '从当前浏览器加载各站点静态资源，按预热、并发、多轮采样统计 HTTP 访问延迟。',
      targets: '测试目标',
      completed: '已完成',
      lowestMedian: '最低中位数',
      averageLoss: '平均丢包率',
      results: '实时结果',
      target: '目标',
      state: '状态',
      median: '中位数',
      fastest: '最快',
      slowest: '最慢',
      packetLoss: '丢包率',
      quality: '质量',
      warmup: '预热',
      unreachable: '不通',
      excellent: '极佳',
      good: '良好',
      normal: '一般',
      poor: '较差',
      timeout: '超时',
      runningCount: '{count} 个检测中',
      completeCount: '{count} 个已完成',
      linkQuality: '{name} 链接质量 {score}'
    },
    cdn: {
      pageTitle: 'CDN 命中节点查询 - Chitanda IP',
      heroTitle: 'CDN 命中节点查询',
      heroCopy: '从当前浏览器并发访问常见 CDN 探针，读取公开响应头或 trace 内容，查看这条网络实际命中的边缘节点。',
      probes: 'CDN 探针',
      success: '成功读取',
      unreadable: '不可读',
      gridAria: 'CDN 命中节点',
      hit: '已命中',
      realtimeProbe: '实时探测',
      nodeMissing: '未暴露节点信息',
      fetchFailed: '获取失败',
      requestTimeout: '请求超时',
      families: {
        anycast: '全球 Anycast',
        cloudflareCn: '中国合作网络',
        edgeCache: '边缘缓存',
        multiCdn: '多 CDN 调度',
        akamaiVideo: '音视频分发',
        edgeoneCn: '腾讯云 EdgeOne',
        ownedEdgeone: '自有 EdgeOne',
        aliyunEsa: '阿里云 ESA'
      }
    },
    dns: {
      pageTitle: 'DNS 出口查询 - Chitanda IP',
      heroTitle: 'DNS 出口查询',
      heroCopy: '通过多组随机 DNS 探针查看当前网络递归 DNS 的出口 IP，用来判断 CDN 调度看到的解析器位置。',
      dnsExit: 'DNS 出口',
      domesticInternational: '国内 / 国际',
      readyProviders: '可用探针',
      results: '检测结果',
      discovered: '{count} 个已发现',
      type: '类型',
      countryRegion: '国家 / 地区',
      waitingDns: '等待 DNS 探针返回',
      loadingGeo: '获取中',
      canceled: '请求已取消',
      timeout: '请求超时',
      jsonpFailed: 'JSONP 加载失败',
      domestic: '国内',
      international: '国际'
    },
    status: {
      pageTitle: '服务状态 - Chitanda IP',
      heroTitle: '全球主流互联网可用性一站式查询',
      heroCopy: '集中查看常用 AI、云服务、开发工具与社区平台的当前运行状态。',
      serviceStats: '服务统计',
      service: '服务',
      failing: '异常',
      maintenance: '维护',
      groupCloud: '云服务',
      groupDeveloper: '开发工具',
      groupCommunity: '社区服务',
      currentIssues: '当前故障',
      maintenanceSection: '维护/计划',
      operational: '运行中',
      loadingTitle: '状态载入中',
      loadingCopy: '正在读取服务列表。',
      failingTitle: '{count} 个服务出现异常',
      failingCopy: '异常服务已置顶显示。',
      maintenanceCopy: '{count} 个服务存在维护安排。',
      maintenanceTitle: '{count} 个服务维护中',
      maintenanceRest: '其余 {count} 个服务正常运行。',
      allOperational: '全部 {count} 个服务正常运行',
      allOperationalCopy: '当前没有发现异常服务。',
      other: '其他',
      unchecked: '未检查',
      selectService: '请选择左侧服务查看详情。',
      readFailed: '状态读取失败：{error}',
      temporarilyUnavailable: '暂不可用',
      officialStatus: '官方状态',
      category: '分类',
      lastCheck: '最后检查',
      recentFailure: '最近异常',
      none: '无',
      recentIncidents: '最近事件',
      scheduledMaintenance: '计划维护',
      recentIncidentsEmpty: '最近事件：无',
      scheduledMaintenanceEmpty: '计划维护：无',
      itemsNeedAttention: '{count} 个服务需要留意。',
      itemsNormal: '{count} 个服务当前正常。',
      itemsMaintenance: '{count} 个服务存在维护信息。',
      detailsAria: '服务状态详情',
      staleTitle: '部分数据使用缓存',
      staleFallback: '状态数据暂时不可刷新',
      staleCopy: '个别服务暂时无法拉取最新结果，页面继续显示最近一次可用数据。'
    },
    state: {
      none: '正常运行',
      maintenance: '维护中',
      minor: '轻微异常',
      major: '明显异常',
      critical: '严重异常',
      unknown: '状态未知'
    }
  },
  'en-US': {
    nav: {
      home: 'Home',
      webrtc: 'WebRTC',
      latency: 'Latency',
      cdn: 'CDN',
      dns: 'DNS',
      status: 'Status',
      api: 'API',
      navigation: 'Page navigation',
      homeAria: 'Chitanda IP Home',
      switchLanguage: 'Switch language',
      refresh: 'Refresh',
      refreshStatus: 'Refresh status',
      rerun: 'Rerun'
    },
    common: {
      loading: 'Loading',
      reload: 'Reload',
      retry: 'Retry',
      waiting: 'Waiting',
      compared: 'Compared',
      copied: 'Copied',
      copyIp: 'Copy IP',
      clickCopyIp: 'Click to copy IP',
      detect: 'Checking',
      ready: 'Ready',
      failed: 'Failed',
      pending: 'Pending',
      unknown: 'Unknown',
      unknownLocation: 'Unknown location',
      noLocation: 'No location yet',
      unknownNetwork: 'Unknown network',
      noNetwork: 'No network yet',
      unavailable: 'Unavailable',
      timeout: 'Timeout',
      complete: 'Complete',
      count: '{count}',
      rows: '{count} rows',
      waitingDetect: 'Waiting',
      noResult: 'No results',
      realtime: 'Live update'
    },
    home: {
      welcome: 'IP Portal',
      lead: 'See the IP address visible to domestic, overseas, Google, and independent probes in one view.',
      viewResults: 'View Results',
      apiDocs: 'API Docs',
      liveCheck: 'Live Check',
      liveCheckCopy: 'Four probes run from your browser and show how different sites see your connection.'
    },
    probe: {
      localTitle: 'Domestic Access',
      localShort: 'Domestic',
      localDescription: 'The IP address seen when visiting sites in mainland China.',
      internationalTitle: 'Overseas Access',
      internationalShort: 'Overseas',
      internationalDescription: 'The IP address seen when visiting overseas services.',
      googleTitle: 'Google Access',
      googleShort: 'Google',
      googleDescription: 'The IP address seen by Google-related services.',
      defaultTitle: 'Independent Probe',
      defaultShort: 'Independent',
      defaultDescription: 'The IP address seen by the independent probe endpoint.',
      missingIp: 'Not available',
      location: 'Location',
      network: 'Network',
      timezone: 'Time Zone'
    },
    verdict: {
      title: 'Access Comparison',
      unknownLabel: 'Waiting for probe',
      unknownSummary: 'The independent probe will be compared once it returns.',
      localLabel: 'Matches domestic access',
      localSummary: 'The independent probe and domestic access see the same IP.',
      remoteLabel: 'Matches overseas access',
      remoteSummary: 'The independent probe matches overseas or Google access.',
      mixedLabel: 'Different results',
      mixedSummary: 'The sites currently see different IP addresses.'
    },
    lookup: {
      title: 'IP Lookup',
      subtitle: 'Geolocation',
      ipAddress: 'IP Address',
      placeholder: 'Enter IPv4 or IPv6',
      button: 'Lookup',
      emptyMessage: 'Enter an IPv4 or IPv6 address.',
      invalidMessage: 'Invalid IP address. Enter a valid IPv4 or IPv6 address.',
      backHome: 'Back Home',
      resultTitle: 'Lookup Result',
      inputTitle: 'Enter IP Address',
      querying: 'Looking up',
      invalidTitle: 'Invalid IP Address',
      notFoundTitle: 'No Result Found',
      notFoundCopy: 'No geolocation information was found for this IP.',
      copiedHint: 'Click the IP address to copy it',
      countryCode: 'Country Code',
      organization: 'Organization',
      coordinate: 'Coordinates'
    },
    map: {
      online: 'Online Map',
      googleBadge: 'Google Maps',
      tencentName: 'Tencent Maps',
      domesticBadge: 'Domestic map',
      domesticChecking: 'Domestic map · Checking',
      domesticBackup: 'Domestic fallback',
      globalBackup: 'Global fallback',
      backup: 'Fallback map',
      tencentAria: 'Tencent map location',
      unavailable: 'Map unavailable',
      loading: 'Loading map',
      googleTitle: 'Google Maps location',
      bingTitle: 'Bing Maps location'
    },
    api: {
      title: 'API Docs',
      pageTitle: 'API Docs - Chitanda IP',
      heroCopy: 'A stable and simple IP geolocation API for scripts, monitoring, websites, and internal tools.',
      endpointsAria: 'API endpoints',
      responseFields: 'Response Fields',
      terminalAria: '{label} SSH example',
      visitor: 'Current Visitor',
      visitorDescription: 'Returns the source IP geolocation, ASN, network, and coordinates for the current request.',
      lookup: 'IP Lookup',
      lookupDescription: 'Look up any IPv4 or IPv6 address. Chinese requests receive localized mainland China regions and carrier aliases.',
      myip: 'Plain IP Echo',
      myipDescription: 'Returns only the current visitor IP. CLI clients can curl the bare hostname; programmatic callers can use format=text.',
      health: 'Service Health',
      healthDescription: 'Returns service availability for origin and edge monitoring.',
      identity: 'Identity',
      location: 'Location',
      network: 'Network',
      time: 'Time',
      target: 'Lookup Target',
      localization: 'Localization',
      textResponse: 'Text Response',
      useCases: 'Use Cases',
      healthStatus: 'Health Status',
      monitoring: 'Monitoring',
      fieldVisitorIp: 'Visitor IP parsed from this request',
      fieldContinent: 'Continent code',
      fieldCountry: 'Country or region and ISO code',
      fieldRegion: 'State, province, city, or region details',
      fieldCoordinate: 'Map coordinates',
      fieldAsn: 'Autonomous system number and organization',
      fieldIsp: 'Carrier or network organization',
      fieldTimezone: 'Time zone and UTC offset',
      fieldPathIp: 'IPv4 or IPv6 address passed in the path',
      fieldAcceptLanguage: 'Chinese requests return localized region, time zone, and organization aliases',
      fieldBody: 'Plain text IP address without JSON wrapping',
      fieldShell: 'Read the exit IP quickly in shell scripts',
      fieldProbe: 'Lightweight connectivity probe',
      fieldOk: 'Whether the service responds normally',
      fieldOpenedAt: 'Current service process start time',
      fieldHttp200: 'Can be used as the success condition for external monitoring',
      fieldBodyOk: 'JSON field for secondary validation'
    },
    routeError: {
      title: 'Page Load Failed',
      copy: 'This page resource failed to load. Refresh and try again.'
    },
    errorPage: {
      forbiddenPageTitle: '403 Forbidden - Chitanda IP',
      notFoundPageTitle: '404 Not Found - Chitanda IP',
      forbiddenKicker: '403 Forbidden',
      notFoundKicker: '404 Not Found',
      forbiddenTitle: 'Access denied',
      notFoundTitle: 'Page not found',
      forbiddenCopy: 'This request is not allowed to access the page or resource. Return home, or check service status and API docs.',
      notFoundCopy: 'No page matches this address. The link may be expired, or the path may be mistyped.',
      homeAction: 'Back home',
      apiAction: 'API Docs',
      statusAction: 'Service Status'
    },
    webrtc: {
      pageTitle: 'WebRTC IP Check - Chitanda IP',
      heroTitle: 'WebRTC IP Check',
      heroCopy: 'Query multiple STUN servers to see which public IP candidates your browser exposes.',
      start: 'Start',
      rerun: 'Rerun',
      httpsExit: 'HTTPS Exit',
      stunPublicIp: 'STUN Public IP',
      domesticStun: 'Domestic STUN',
      globalStun: 'Global STUN',
      fetching: 'Fetching',
      notDetected: 'Not checked',
      probing: 'Probing',
      pendingCount: '{count} pending',
      noticeRunningTitle: 'Checking WebRTC IP',
      noticeRunningCopy: 'Waiting for STUN nodes to return candidates.',
      noticeFailedTitle: 'Check failed',
      noticeFailedCopy: 'The WebRTC check did not complete.',
      noticeUnsupportedTitle: 'WebRTC is not supported',
      noticeUnsupportedCopy: 'This browser cannot run the RTCPeerConnection probe.',
      noticeEmptyTitle: 'No public IP detected',
      noticeEmptyCopy: 'No public address was found in the STUN candidates.',
      noticeDetectedTitle: 'Detected {count} WebRTC public IPs',
      noticeDetectedCopy: 'Each STUN node is listed below.',
      results: 'Results',
      public: 'Public (STUN)',
      relay: 'Relay (TURN)',
      peer: 'Peer reflexive',
      host: 'Local candidate',
      candidate: 'Candidate',
      domestic: 'Domestic',
      global: 'Global',
      node: 'Node',
      state: 'Status',
      detected: 'Detected',
      notFound: 'Not detected',
      noResponse: 'No response',
      unsupported: 'Unsupported'
    },
    latency: {
      pageTitle: 'Latency Test - Chitanda IP',
      heroTitle: 'Browser Latency Test',
      heroCopy: 'Load static assets from each target in the browser and summarize HTTP latency across warmup, concurrency, and multiple samples.',
      targets: 'Targets',
      completed: 'Completed',
      lowestMedian: 'Lowest Median',
      averageLoss: 'Average Loss',
      results: 'Live Results',
      target: 'Target',
      state: 'Status',
      median: 'Median',
      fastest: 'Fastest',
      slowest: 'Slowest',
      packetLoss: 'Loss',
      quality: 'Quality',
      warmup: 'Warmup',
      unreachable: 'Unreachable',
      excellent: 'Excellent',
      good: 'Good',
      normal: 'Fair',
      poor: 'Poor',
      timeout: 'Timeout',
      runningCount: '{count} running',
      completeCount: '{count} complete',
      linkQuality: '{name} link quality {score}'
    },
    cdn: {
      pageTitle: 'CDN Node Lookup - Chitanda IP',
      heroTitle: 'CDN Node Lookup',
      heroCopy: 'Probe common CDN endpoints from this browser, read public headers or trace output, and show which edge node your network reaches.',
      probes: 'CDN Probes',
      success: 'Readable',
      unreadable: 'Unreadable',
      gridAria: 'CDN hit nodes',
      hit: 'Hit',
      realtimeProbe: 'Live probe',
      nodeMissing: 'Node information not exposed',
      fetchFailed: 'Fetch failed',
      requestTimeout: 'Request timeout',
      families: {
        anycast: 'Global Anycast',
        cloudflareCn: 'China partner network',
        edgeCache: 'Edge cache',
        multiCdn: 'Multi-CDN routing',
        akamaiVideo: 'Media delivery',
        edgeoneCn: 'Tencent EdgeOne',
        ownedEdgeone: 'Owned EdgeOne',
        aliyunEsa: 'Alibaba Cloud ESA'
      }
    },
    dns: {
      pageTitle: 'DNS Exit Lookup - Chitanda IP',
      heroTitle: 'DNS Exit Lookup',
      heroCopy: 'Use randomized DNS probes to discover the recursive DNS exit IPs visible to CDN routing systems.',
      dnsExit: 'DNS Exit',
      domesticInternational: 'Domestic / Global',
      readyProviders: 'Ready Probes',
      results: 'Results',
      discovered: '{count} discovered',
      type: 'Type',
      countryRegion: 'Country / Region',
      waitingDns: 'Waiting for DNS probes',
      loadingGeo: 'Loading',
      canceled: 'Request canceled',
      timeout: 'Request timeout',
      jsonpFailed: 'JSONP load failed',
      domestic: 'Domestic',
      international: 'Global'
    },
    status: {
      pageTitle: 'Service Status - Chitanda IP',
      heroTitle: 'One-page availability for major internet services',
      heroCopy: 'Track the current operating status of AI, cloud, developer, and community platforms.',
      serviceStats: 'Service statistics',
      service: 'Services',
      failing: 'Issues',
      maintenance: 'Maintenance',
      groupCloud: 'Cloud Services',
      groupDeveloper: 'Developer Tools',
      groupCommunity: 'Community',
      currentIssues: 'Current Issues',
      maintenanceSection: 'Maintenance / Scheduled',
      operational: 'Operational',
      loadingTitle: 'Loading status',
      loadingCopy: 'Reading the service list.',
      failingTitle: '{count} services have issues',
      failingCopy: 'Affected services are pinned to the top.',
      maintenanceCopy: '{count} services have maintenance windows.',
      maintenanceTitle: '{count} services under maintenance',
      maintenanceRest: '{count} other services are operational.',
      allOperational: 'All {count} services are operational',
      allOperationalCopy: 'No service issues are currently detected.',
      other: 'Other',
      unchecked: 'Not checked',
      selectService: 'Select a service on the left to view details.',
      readFailed: 'Status read failed: {error}',
      temporarilyUnavailable: 'temporarily unavailable',
      officialStatus: 'Official status',
      category: 'Category',
      lastCheck: 'Last Check',
      recentFailure: 'Recent Failure',
      none: 'None',
      recentIncidents: 'Recent Incidents',
      scheduledMaintenance: 'Scheduled Maintenance',
      recentIncidentsEmpty: 'Recent incidents: none',
      scheduledMaintenanceEmpty: 'Scheduled maintenance: none',
      itemsNeedAttention: '{count} services need attention.',
      itemsNormal: '{count} services are currently operational.',
      itemsMaintenance: '{count} services have maintenance information.',
      detailsAria: 'Service status details',
      staleTitle: 'Some data is cached',
      staleFallback: 'Status data cannot be refreshed right now',
      staleCopy: 'Some services could not fetch fresh data; the page continues to show the latest available data.'
    },
    state: {
      none: 'Operational',
      maintenance: 'Maintenance',
      minor: 'Minor Issue',
      major: 'Major Issue',
      critical: 'Critical Issue',
      unknown: 'Unknown'
    }
  }
};

const traditionalPhrases = [
  ['中国大陆', '中國大陸'],
  ['中国台湾', '中國台灣'],
  ['腾讯', '騰訊'],
  ['阿里云', '阿里雲'],
  ['云服务', '雲服務'],
  ['开发工具', '開發工具'],
  ['社区服务', '社群服務'],
  ['状态', '狀態'],
  ['检测', '檢測'],
  ['查询', '查詢'],
  ['刷新', '重新整理'],
  ['归属', '歸屬'],
  ['网络', '網路'],
  ['运营商', '營運商'],
  ['节点', '節點'],
  ['缓存', '快取'],
  ['维护', '維護'],
  ['响应', '回應'],
  ['访问', '存取'],
  ['返回', '傳回'],
  ['当前', '目前'],
  ['页面', '頁面'],
  ['信息', '資訊'],
  ['地址', '位址'],
  ['字段', '欄位'],
  ['脚本', '指令碼'],
  ['监控', '監控'],
  ['国内', '國內'],
  ['境外', '境外'],
  ['地图', '地圖']
];

const traditionalChars = {
  简: '簡', 体: '體', 页: '頁', 面: '面', 导: '導', 航: '航', 切: '切', 换: '換',
  语: '語', 言: '言', 加: '加', 载: '載', 中: '中', 重: '重', 新: '新', 试: '試',
  等: '等', 待: '待', 对: '對', 比: '比', 已: '已', 复: '複', 制: '製', 点: '點',
  击: '擊', 未: '未', 知: '知', 位: '位', 置: '置', 暂: '暫', 运: '運', 营: '營',
  商: '商', 不: '不', 可: '可', 用: '用', 超: '超', 时: '時', 完: '完', 成: '成',
  个: '個', 条: '條', 结: '結', 果: '果', 实: '實', 更: '更', 欢: '歡', 迎: '迎',
  来: '來', 独: '獨', 屏: '屏', 看: '看', 同: '同', 网: '網', 站: '站', 显: '顯',
  示: '示', 文: '文', 档: '檔', 项: '項', 目: '目', 浏: '瀏', 览: '覽', 器: '器',
  地: '地', 址: '址', 国: '國', 际: '際', 说: '說', 明: '明', 缺: '缺', 省: '省',
  市: '市', 机: '機', 构: '構', 坐: '坐', 标: '標', 线: '線', 图: '圖', 备: '備',
  份: '份', 端: '端', 稳: '穩', 定: '定', 洁: '潔', 属: '屬', 接: '接',
  口: '口', 合: '合', 内: '內', 部: '部', 工: '工', 具: '具', 调: '調', 包: '包',
  装: '裝', 身: '身', 纯: '純', 本: '本', 回: '回', 健: '健',
  康: '康', 场: '場', 景: '景', 自: '自', 治: '治', 系: '系', 统: '統', 编: '編',
  号: '號', 组: '組', 织: '織', 传: '傳', 入: '入', 请: '請', 求: '求', 别: '別',
  名: '名', 快: '快', 速: '速', 读: '讀', 取: '取', 出: '出', 符: '符', 件: '件',
  外: '外', 连: '連', 通: '通', 性: '性', 二: '二', 次: '次', 校: '校', 验: '驗',
  失: '失', 败: '敗', 后: '後', 测: '測', 节: '節', 公: '公', 候: '候', 选: '選',
  预: '預', 热: '熱', 并: '並', 发: '發', 轮: '輪', 采: '採', 样: '樣',
  计: '計', 质: '質', 量: '量', 极: '極', 良: '良', 较: '較', 差: '差', 命: '命',
  随: '隨', 判: '判', 断: '斷', 解: '解', 析: '析', 轻: '輕',
  异: '異', 常: '常', 严: '嚴', 类: '類', 详: '詳', 迟: '遲'
};

function mapMessageStrings(value, mapper) {
  if (typeof value === 'string') return mapper(value);
  if (Array.isArray(value)) return value.map((item) => mapMessageStrings(item, mapper));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapMessageStrings(item, mapper)]));
  }
  return value;
}

function toTraditionalChinese(value) {
  let output = value;
  for (const [from, to] of traditionalPhrases) {
    output = output.replaceAll(from, to);
  }
  return [...output].map((char) => traditionalChars[char] || char).join('');
}

function mergeMessages(base, overrides) {
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object') {
      result[key] = mergeMessages(base[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

messages[ZH_TW_LOCALE] = mergeMessages(
  mapMessageStrings(messages[DEFAULT_LOCALE], toTraditionalChinese),
  {
    nav: {
      homeAria: 'Chitanda IP 首頁',
      switchLanguage: '切換語言'
    },
    home: {
      welcome: 'IP へようこそ',
      lead: '國內・境外・Google・獨立檢測，一屏查看不同網站看到的 IP。'
    },
    api: {
      title: 'API 文件',
      pageTitle: 'API 文件 - Chitanda IP'
    }
  }
);

messages[JA_LOCALE] = mergeMessages(messages[EN_LOCALE], {
  nav: {
    home: 'ホーム',
    webrtc: 'WebRTC',
    latency: '遅延',
    cdn: 'CDN',
    dns: 'DNS',
    status: '状態',
    api: 'API',
    navigation: 'ページナビゲーション',
    homeAria: 'Chitanda IP ホーム',
    switchLanguage: '言語を切り替え',
    refresh: '更新',
    refreshStatus: '状態を更新',
    rerun: '再チェック'
  },
  common: {
    loading: '読み込み中',
    reload: '再読み込み',
    retry: '再試行',
    waiting: '待機中',
    compared: '比較済み',
    copied: 'コピーしました',
    copyIp: 'IP をコピー',
    clickCopyIp: 'クリックして IP をコピー',
    detect: 'チェック中',
    ready: '取得済み',
    failed: '失敗',
    pending: '未チェック',
    unknown: '不明',
    unknownLocation: '不明な場所',
    noLocation: '位置情報なし',
    unknownNetwork: '不明なネットワーク',
    noNetwork: 'ネットワーク情報なし',
    unavailable: '利用不可',
    timeout: 'タイムアウト',
    complete: '完了',
    count: '{count} 件',
    rows: '{count} 行',
    waitingDetect: 'チェック待ち',
    noResult: '結果なし',
    realtime: 'リアルタイム更新'
  },
  home: {
    welcome: 'IP ポータル',
    lead: '国内・海外・Google・独立プローブから見える IP アドレスを一画面で確認できます。',
    viewResults: '結果を見る',
    apiDocs: 'API ドキュメント',
    liveCheck: 'アクセスチェック',
    liveCheckCopy: '4 つのプローブをブラウザから同時に実行し、接続がどう見えているかを表示します。'
  },
  probe: {
    localTitle: '国内アクセス',
    localShort: '国内',
    localDescription: '中国国内サイトにアクセスしたときに見える IP アドレス。',
    internationalTitle: '海外アクセス',
    internationalShort: '海外',
    internationalDescription: '海外サービスにアクセスしたときに見える IP アドレス。',
    googleTitle: 'Google アクセス',
    googleShort: 'Google',
    googleDescription: 'Google 関連サービスから見える IP アドレス。',
    defaultTitle: '独立プローブ',
    defaultShort: '独立',
    defaultDescription: '独立した検出入口から見える IP アドレス。',
    missingIp: '未取得',
    location: '位置',
    network: 'ネットワーク',
    timezone: 'タイムゾーン'
  },
  verdict: {
    title: 'アクセス比較',
    unknownLabel: 'チェック待ち',
    unknownSummary: '独立プローブの結果が返ると自動で比較します。',
    localLabel: '国内アクセスと一致',
    localSummary: '独立プローブと国内アクセスが同じ IP を見ています。',
    remoteLabel: '海外アクセスと一致',
    remoteSummary: '独立プローブは海外または Google アクセスと一致しています。',
    mixedLabel: '結果が異なります',
    mixedSummary: '各サイトから見える IP アドレスが一致していません。'
  },
  lookup: {
    title: 'IP 検索',
    subtitle: '位置情報',
    ipAddress: 'IP アドレス',
    placeholder: 'IPv4 または IPv6 を入力',
    button: '検索',
    emptyMessage: 'IPv4 または IPv6 アドレスを入力してください。',
    invalidMessage: 'IP アドレスが無効です。正しい IPv4 または IPv6 を入力してください。',
    backHome: 'ホームへ戻る',
    resultTitle: '検索結果',
    inputTitle: 'IP アドレスを入力',
    querying: '検索中',
    invalidTitle: '無効な IP アドレス',
    notFoundTitle: '結果が見つかりません',
    notFoundCopy: 'この IP の位置情報は見つかりませんでした。',
    copiedHint: 'IP アドレスをクリックしてコピー',
    countryCode: '国コード',
    organization: '組織',
    coordinate: '座標'
  },
  map: {
    online: 'オンライン地図',
    googleBadge: 'Google マップ',
    tencentName: 'Tencent マップ',
    domesticBadge: '国内地図',
    domesticChecking: '国内地図 · チェック中',
    domesticBackup: '国内バックアップ',
    globalBackup: 'グローバルバックアップ',
    backup: 'バックアップ地図',
    tencentAria: 'Tencent マップ位置',
    unavailable: '地図は利用できません',
    loading: '地図を読み込み中',
    googleTitle: 'Google マップ位置',
    bingTitle: 'Bing マップ位置'
  },
  api: {
    title: 'API ドキュメント',
    pageTitle: 'API ドキュメント - Chitanda IP',
    heroCopy: 'スクリプト、監視、Web サイト、社内ツールで使いやすい安定した IP 位置情報 API です。',
    endpointsAria: 'API エンドポイント',
    responseFields: 'レスポンスフィールド',
    terminalAria: '{label} SSH 例',
    visitor: '現在の訪問者',
    visitorDescription: '現在のリクエスト元 IP の位置情報、ASN、ネットワーク、座標を返します。',
    lookup: 'IP 検索',
    lookupDescription: '任意の IPv4 または IPv6 アドレスを検索します。',
    myip: 'プレーン IP 応答',
    myipDescription: '現在の訪問者 IP のみを返します。CLI ではホスト名だけを curl でき、プログラムからは format=text を使えます。',
    health: 'サービスヘルス',
    healthDescription: '送信元とエッジ監視向けにサービス可用性を返します。'
  },
  routeError: {
    title: 'ページ読み込み失敗',
    copy: 'ページリソースの読み込みに失敗しました。更新して再試行してください。'
  },
  errorPage: {
    forbiddenPageTitle: '403 アクセス拒否 - Chitanda IP',
    notFoundPageTitle: '404 ページが見つかりません - Chitanda IP',
    forbiddenKicker: '403 Forbidden',
    notFoundKicker: '404 Not Found',
    forbiddenTitle: 'アクセスできません',
    notFoundTitle: 'ページが見つかりません',
    forbiddenCopy: 'このページまたはリソースへのアクセスは許可されていません。ホームに戻るか、サービス状態と API ドキュメントを確認してください。',
    notFoundCopy: 'このアドレスに対応するページはありません。リンクが古いか、パスが間違っている可能性があります。',
    homeAction: 'ホームへ戻る',
    apiAction: 'API ドキュメント',
    statusAction: 'サービス状態'
  },
  webrtc: {
    pageTitle: 'WebRTC IP チェック - Chitanda IP',
    heroTitle: 'WebRTC IP チェック',
    heroCopy: '複数の STUN ノードで、ブラウザが公開する公网候補 IP を確認します。',
    start: '開始',
    rerun: '再チェック',
    results: '結果',
    public: '公网 (STUN)',
    relay: 'リレー (TURN)',
    candidate: '候補アドレス',
    domestic: '国内',
    global: 'グローバル',
    node: 'ノード',
    state: '状態',
    detected: '検出済み',
    notFound: '未検出',
    noResponse: '応答なし',
    unsupported: '非対応'
  },
  latency: {
    pageTitle: '遅延テスト - Chitanda IP',
    heroTitle: 'ブラウザ遅延テスト',
    heroCopy: '現在のブラウザから各サイトの静的リソースを読み込み、HTTP 遅延を集計します。',
    targets: 'テスト対象',
    completed: '完了',
    lowestMedian: '最小中央値',
    averageLoss: '平均損失',
    results: 'リアルタイム結果',
    target: '対象',
    state: '状態',
    median: '中央値',
    fastest: '最速',
    slowest: '最遅',
    packetLoss: '損失',
    quality: '品質'
  },
  cdn: {
    pageTitle: 'CDN ノード検索 - Chitanda IP',
    heroTitle: 'CDN ノード検索',
    heroCopy: 'ブラウザから CDN プローブにアクセスし、実際に到達したエッジノードを表示します。',
    probes: 'CDN プローブ',
    success: '読み取り成功',
    unreadable: '読み取り不可',
    hit: 'ヒット',
    nodeMissing: 'ノード情報なし',
    fetchFailed: '取得失敗',
    requestTimeout: 'タイムアウト'
  },
  dns: {
    pageTitle: 'DNS 出口検索 - Chitanda IP',
    heroTitle: 'DNS 出口検索',
    heroCopy: 'ランダム DNS プローブで、現在のネットワークの再帰 DNS 出口 IP を確認します。',
    dnsExit: 'DNS 出口',
    domesticInternational: '国内 / 国際',
    readyProviders: '利用可能なプローブ',
    results: '結果',
    discovered: '{count} 件検出',
    type: '種類',
    countryRegion: '国 / 地域',
    waitingDns: 'DNS プローブ待ち',
    domestic: '国内',
    international: '国際'
  },
  status: {
    pageTitle: 'サービス状態 - Chitanda IP',
    heroTitle: '主要インターネットサービスの状態',
    heroCopy: 'AI、クラウド、開発ツール、コミュニティサービスの稼働状況をまとめて確認できます。',
    serviceStats: 'サービス統計',
    service: 'サービス',
    failing: '障害',
    maintenance: 'メンテナンス',
    groupCloud: 'クラウド',
    groupDeveloper: '開発ツール',
    groupCommunity: 'コミュニティ',
    currentIssues: '現在の障害',
    maintenanceSection: 'メンテナンス予定',
    operational: '稼働中',
    loadingTitle: '状態を読み込み中',
    loadingCopy: 'サービス一覧を読み込んでいます。',
    failingTitle: '{count} 件のサービスに異常',
    failingCopy: '異常のあるサービスを上部に表示しています。',
    allOperational: '全 {count} サービスが正常',
    allOperationalCopy: '現在、異常は検出されていません。',
    officialStatus: '公式ステータス',
    category: 'カテゴリ',
    lastCheck: '最終確認',
    recentIncidents: '最近のインシデント',
    scheduledMaintenance: '予定メンテナンス',
    none: 'なし'
  },
  state: {
    none: '正常',
    maintenance: 'メンテナンス中',
    minor: '軽微な異常',
    major: '大きな異常',
    critical: '重大な異常',
    unknown: '不明'
  }
});

const I18nContext = createContext(null);

function readPathname() {
  return window.location.pathname || '/';
}

export function localeFromPathname(pathname = readPathname()) {
  const first = pathname.split('/').filter(Boolean)[0];
  const match = LOCALE_ORDER.find((locale) => LOCALES[locale].path === first);
  if (match) return match;
  return DEFAULT_LOCALE;
}

export function stripLocaleFromPathname(pathname = readPathname()) {
  const locale = localeFromPathname(pathname);
  const prefix = LOCALES[locale]?.path;
  if (!prefix) return pathname || '/';
  const stripped = pathname.replace(new RegExp(`^/${prefix}(?=/|$)`), '') || '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

export function localizedPath(path, locale = DEFAULT_LOCALE) {
  if (!path) return path;
  if (/^(https?:|mailto:|tel:)/i.test(path)) return path;
  if (path.startsWith('#')) return path;

  const url = new URL(path, window.location.origin);
  const strippedPath = stripLocaleFromPathname(url.pathname);
  const prefix = LOCALES[locale]?.path;
  const localized = prefix
    ? `/${prefix}${strippedPath === '/' ? '/' : strippedPath}`
    : strippedPath;
  return `${localized}${url.search}${url.hash}`;
}

function readMessage(locale, key) {
  const parts = key.split('.');
  let value = messages[locale];
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value === 'string') return applySiteName(value);

  value = messages[DEFAULT_LOCALE];
  for (const part of parts) {
    value = value?.[part];
  }
  return typeof value === 'string' ? applySiteName(value) : key;
}

function interpolate(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => (
    values[key] === undefined || values[key] === null ? '' : String(values[key])
  ));
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localeFromPathname());

  useEffect(() => {
    const update = () => setLocaleState(localeFromPathname());
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = LOCALES[locale].htmlLang;
  }, [locale]);

  const value = useMemo(() => {
    const t = (key, values) => interpolate(readMessage(locale, key), values);
    const switchTo = LOCALE_ORDER[(LOCALE_ORDER.indexOf(locale) + 1) % LOCALE_ORDER.length] || DEFAULT_LOCALE;
    return {
      locale,
      localeInfo: LOCALES[locale],
      localeOptions: LOCALE_ORDER.map((optionLocale) => ({
        locale: optionLocale,
        ...LOCALES[optionLocale]
      })),
      switchLocale: switchTo,
      switchLocaleInfo: LOCALES[switchTo],
      t,
      isEnglish: locale === EN_LOCALE,
      localizedPath: (path) => localizedPath(path, locale),
      localePath: (targetLocale) => localizedPath(`${stripLocaleFromPathname()}${window.location.search}${window.location.hash}`, targetLocale),
      switchLocalePath: () => localizedPath(`${stripLocaleFromPathname()}${window.location.search}${window.location.hash}`, switchTo),
      number: (value) => new Intl.NumberFormat(locale).format(value)
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
