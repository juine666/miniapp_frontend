# StyleMirror WeChat Mini Program

## Setup
1. Open WeChat Developer Tools, import this folder `miniapp-frontend`.
2. Fill AppID (test account works) in `project.config.json`.
3. Ensure backend running at `http://localhost:8080` or update `app.js` baseURL.

## Pages
- Home: list/search/nearby products
- Detail: view and buy, share
- Publish: upload via Aliyun OSS policy, create product
- User: profile and contact info
- Orders: list my orders
- Share: resolve share code to product detail

## Notes
- Login calls `/api/auth/wechat/login` using `wx.login` code.
- Requests attach `Authorization: Bearer <token>` when available.
- Nearby uses `wx.getLocation`; allow permission when prompted.
