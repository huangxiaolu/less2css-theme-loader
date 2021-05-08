# less2css-theme-loader
生成主题切换器代码的webpack plugin & loader。目前只提供基础功能，且没有任何容错能力。

**原理**
将主题目录下的less变量编译成css变量，并将代码中使用less变量的地方替换成`var(--CSS变量)`的形式。

同时，注入全局函数 `window.__changeTheme__(theme)`，用于运行时切换主题。
## 用法

**示例目录结构**
```
|- src
  |- themes
    |- base.less // 基础的样式变量，例如element-ui的变量或者antd的主题变量
    |- theme1.less // 扩展和定制了样式变量的主题样式变量，下同
    |- theme2.less
    |- ...
```

**安装**
```
npm install less2css-theme-loader --save-dev
```
或者
```
yarn add -D less2css-theme-loader
```

**webpack.config.js**
```
const path = require("path");
const { Less2CssThemePlugin } = require("less2css-theme-loader");

module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: [
          // ...
          "less-loader",
          "less2css-theme-loader"
        ]
      }
    ]
  },
  plugins: [
    // ...
    new Less2CssThemePlugin({
      // 初始化时默认的主题文件名，在运行时可以用window.__changeTheme__(themeName)指定。themeName跟themePath里的各个主题文件名一一对应。
      defaultTheme: "default",
      // 各种主题样式变量，它们能扩展（覆盖、新增）基础变量
      themePath: path.resolve(__dirname, "src/themes/"),
      // 基础样式变量
      baseVariablePath: path.resolve(__dirname, "src/themes/element-variables.less"),
    })
  ]
}
```

假如是vue项目：
**vue.config.js**

```
const path = require("path");
const { Less2CssThemePlugin } = require("less2css-theme-loader");

function addLessVars(rule) {
  rule.use("less2css-theme-loader").loader("less2css-theme-loader");
}

module.exports = {
  // ...
  chainWebpack(config) {
    // ...
    // 自动导入less变量文件
    const types = ["vue-modules", "vue", "normal-modules", "normal"];
    types.forEach((type) =>
      addLessVars(config.module.rule("less").oneOf(type))
    );
  },
  configureWebpack: {
    // ...
    plugins: [
      // ...
      new Less2CssThemePlugin({
        // 初始化时默认的主题文件名，在运行时可以用window.__changeTheme__(themeName)指定。themeName跟themePath里的各个主题文件名一一对应。
        defaultTheme: "default",
        // 各种主题样式变量，它们能扩展（覆盖或新增）基础变量
        themePath: path.resolve(__dirname, "src/themes/"),
        // 基础样式变量
        baseVariablePath: path.resolve(__dirname, "src/themes/element-variables.less"),
      })
    ],
  },
};
```

## todo

- [ ] 监听本地的主题文件改变，并重新触发编译。
- [ ] 编译完毕时清理临时文件。
- [ ] 根据实际用到变量数，缩减最终生成的CSS变量。
- [ ] 简化配置项里各种路径参数的写法。
- [ ] 增加example目录：常规写法、vue项目写法。
- [ ] 删除生成的js里的注释