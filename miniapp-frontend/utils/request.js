const app = getApp();

// 标记是否正在登录，避免重复登录
let isLogging = false;
// 等待登录完成的请求队列
let pendingRequests = [];

function request({ url, method = 'GET', data = {}, header = {}, retryCount = 0 }) {
  return new Promise((resolve, reject) => {
    const token = app?.globalData?.token || wx.getStorageSync('token');
    const headers = Object.assign({ 'Content-Type': 'application/json' }, header);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const fullUrl = app.globalData.baseURL + url;
    console.log('请求:', method, fullUrl, data);
    
    const doRequest = () => {
      const currentToken = app?.globalData?.token || wx.getStorageSync('token');
      const currentHeaders = Object.assign({ 'Content-Type': 'application/json' }, header);
      if (currentToken) currentHeaders['Authorization'] = 'Bearer ' + currentToken;
      
      wx.request({
        url: fullUrl,
        method,
        data,
        header: currentHeaders,
        success: (res) => {
          console.log('响应:', res.statusCode, res.data);
          
          const responseData = res.data;
          
          // 调试模式：放行所有请求，不进行登录验证
          // 检查 HTTP 状态码
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 正常响应
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(responseData)}`));
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(err);
        }
      });
    };
    
    doRequest();
  });
}

module.exports = { request };

