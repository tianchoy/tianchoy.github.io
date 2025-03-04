在微信小程序云开发提供了便捷的数据库和云函数功能，可以轻松存储和获取用户信息。以下是代码示例：

1. **开通云开发**：
   - 在微信开发者工具中，开通云开发功能，并初始化云开发环境。
   - 在 `app.js` 中初始化云开发环境：
     ```javascript
     wx.cloud.init({
       env: 'your-environment-id', // 替换为你的云开发环境ID
       traceUser: true,
     });
     ```

### 2. 获取用户的 `openid`
用户的 `openid` 是唯一的标识符，可以通过云函数获取。

#### 示例代码
1. **创建云函数**：
   - 在云开发控制台中，创建一个云函数（如 `getOpenid`）。
   - 云函数代码：
     ```javascript
     // cloudfunctions/getOpenid/index.js
     const cloud = require('wx-server-sdk');
     cloud.init();
     exports.main = async (event, context) => {
       const wxContext = cloud.getWXContext();
       return {
         openid: wxContext.OPENID
       };
     };
     ```

2. **调用云函数获取 `openid`**：
   - 在小程序页面中调用云函数，获取用户的 `openid` 并存储到本地缓存中。
     ```javascript
     Page({
       onLoad() {
         wx.cloud.callFunction({
           name: 'getOpenid',
           success: (res) => {
             const openid = res.result.openid;
             wx.setStorageSync('openid', openid); // 存储 openid
             console.log('获取 openid 成功:', openid);
           },
           fail: (err) => {
             console.log('获取 openid 失败:', err);
           }
         });
       }
     });
     ```

---

## 从云数据库读取用户信息
在需要显示用户信息的地方，可以从云数据库中读取用户信息。

#### 示例代码
```javascript
Page({
  data: {
    userInfo: {} // 用于存储从云数据库读取的用户信息
  },
  onLoad() {
    this.getUserInfoFromCloud();
  },
  getUserInfoFromCloud() {
    const db = wx.cloud.database();
    const openid = wx.getStorageSync('openid');
    db.collection('users').where({
      openid: openid
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          this.setData({
            userInfo: res.data[0]
          });
          console.log('从云数据库读取用户信息成功:', res.data[0]);
        } else {
          console.log('未找到用户信息');
        }
      },
      fail: (err) => {
        console.log('从云数据库读取用户信息失败:', err);
      }
    });
  }
});
```

---
