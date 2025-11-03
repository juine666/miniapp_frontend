<script>
export default {
  globalData: {
    baseURL: 'http://192.168.101.4:8081',
    token: '',
    openid: '',
    editingProductId: null
  },
  onLaunch() {
    // 恢复已保存的登录状态
    const token = uni.getStorageSync('token')
    const openid = uni.getStorageSync('openid')
    const userId = uni.getStorageSync('userId')
    if (token) {
      this.globalData.token = token
      this.globalData.openid = openid
      this.globalData.userId = userId
    }
  },
  methods: {
    doLogin(nickname, avatarUrl) {
      return new Promise((resolve, reject) => {
        // 登录获取code
        uni.login({
          success: (res) => {
            if (res.code) {
              console.log('获取到登录code:', res.code)
              uni.request({
                url: this.globalData.baseURL + '/api/auth/wechat/login',
                method: 'POST',
                data: {
                  code: res.code,
                  nickname: nickname,
                  avatarUrl: avatarUrl
                },
                success: (r) => {
                  if (r.data && r.data.code === 0) {
                    const { token, openid, userId, nickname: savedNickname, avatarUrl: savedAvatarUrl } = r.data.data
                    this.globalData.token = token
                    this.globalData.openid = openid
                    this.globalData.userId = userId
                    uni.setStorageSync('token', token)
                    uni.setStorageSync('openid', openid)
                    uni.setStorageSync('userId', userId)
                    resolve({ token, openid, userId })
                  } else {
                    reject(new Error(r.data?.message || '登录失败'))
                  }
                },
                fail: (err) => {
                  console.error('登录请求失败', err)
                  reject(err)
                }
              })
            } else {
              console.error('uni.login失败，未获取到code')
              reject(new Error('获取登录code失败'))
            }
          },
          fail: (err) => {
            console.error('uni.login调用失败', err)
            reject(err)
          }
        })
      })
    }
  }
}
</script>

<style>
/*每个页面公共css */
page {
  background-color: #f6f6f6;
}
</style>

