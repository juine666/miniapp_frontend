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
          
          // 检查是否是"请先登录"的错误（无论 HTTP 状态码是多少）
          if (responseData && responseData.code === 400 && responseData.message === '请先登录') {
            // 避免无限重试
            if (retryCount >= 1) {
              console.error('登录后仍然返回未登录错误，可能登录失败');
              reject(new Error('登录失败，请检查登录状态'));
              return;
            }
            
            console.log('🚀 [自动登录] 检测到未登录错误，开始自动登录...', responseData);
            
            // 如果正在登录，将请求加入队列
            if (isLogging) {
              pendingRequests.push({ resolve, reject, url, method, data, header, retryCount: retryCount + 1 });
              return;
            }
            
            // 开始登录
            isLogging = true;
            app.doLogin()
              .then(() => {
                console.log('自动登录成功，重试请求');
                isLogging = false;
                
                // 重试当前请求
                request({ url, method, data, header, retryCount: retryCount + 1 })
                  .then(resolve)
                  .catch(reject);
                
                // 处理队列中的其他请求
                const queue = pendingRequests.slice();
                pendingRequests = [];
                queue.forEach((req) => {
                  request({ url: req.url, method: req.method, data: req.data, header: req.header, retryCount: req.retryCount })
                    .then(req.resolve)
                    .catch(req.reject);
                });
              })
              .catch((err) => {
                console.error('自动登录失败:', err);
                isLogging = false;
                
                // 登录失败，拒绝当前请求和队列中的请求
                reject(new Error('自动登录失败，请手动登录'));
                
                const queue = pendingRequests.slice();
                pendingRequests = [];
                queue.forEach(({ reject: rejectRequest }) => {
                  rejectRequest(new Error('自动登录失败，请手动登录'));
                });
              });
            return;
          }
          
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

