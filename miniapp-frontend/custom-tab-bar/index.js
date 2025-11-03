Component({
  data: {
    selected: 0,
    color: "#888",
    selectedColor: "#333",
    backgroundColor: "#fff",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页"
      },
      {
        pagePath: "/pages/nearby/nearby",
        text: "附近"
      },
      {
        pagePath: "/pages/publish/publish",
        text: "发布",
        isSpecial: true
      },
      {
        pagePath: "/pages/message/message",
        text: "消息"
      },
      {
        pagePath: "/pages/user/user",
        text: "我的"
      }
    ]
  },
  attached() {
    // 获取当前页面路径
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const url = '/' + currentPage.route;
      
      // 查找对应的tabBar索引
      const index = this.data.list.findIndex(item => {
        return url === item.pagePath;
      });
      
      if (index !== -1) {
        this.setData({
          selected: index
        });
      }
    }
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;
      
      // 更新选中状态
      this.setData({
        selected: index
      });
      
      // 跳转到对应页面
      wx.switchTab({
        url: url
      });
    }
  }
});

