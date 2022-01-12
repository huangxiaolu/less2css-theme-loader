/**
 * 插件初始化时（todo：watch theme/xxx.less改变），执行以下操作：
 * 1. 读themes/xxx.less，调用less解析生成主题-样式规则map。形如：
 *  {
 *    theme1: ":root{--var: computedValue1}", 
 *    theme2: ":root{--var: computedValue2}" 
 *  }
 * 3. 将base+default的中间产物，自动加入每个less文件的开头。（通过loader）
 * 4. 根据map生成window.__changeTheme__方法，并写入每个entry。
 * 5. 页面运行时，调用window.__changeTheme__方法，传入主题名，即可切换主题变量。
 */
const fs = require("fs");
const path = require("path");
const Chokidar = require("chokidar");
const less = require("less");
const lessVarsToJs = require("less-vars-to-js");
const { isFile, readFile } = require("./utils");
const getThemeCode = require("./getThemeCode");
const lessPath = path.join(__dirname, "./.themeVariable.less");
const jsPath = path.join(__dirname, "./.change-theme.js");

class Less2CssThemePlugin {
  static defaultOptions = {
    themePath: "",
  };
  constructor(options = {}) {
    this.options = { ...Less2CssThemePlugin.defaultOptions, ...options };
    // 1. 初始化设置主题文件监听器。保存下来，在编译前和输出阶段，插入特定的代码。
    this.resultCollector = {

      // 由base和default合并，编译开始之前，写入每个less开头
      tempDefaultLessVars: "",

      /**
       * emit的时候，转变成changeTheme方法写入到每个entry
       * {
       *    theme1: cssVars1,
       *    theme2: cssVars2
       * }
       */
      themes: {},
    };
  }
  // 安装插件的时候执行apply方法
  async apply(compiler) {
    this.context = compiler.context;

    //  todo 监听变量文件文件发生变化时再执行一次收集
    // Chokidar.watch([baseVariablePath, themePath]).on("all", async (event, filepath) => {
    // });
    // 初始收集
    
    await this.collectThemeResults();

    const { entry } = compiler.options;

    let newEntry = {};

    try {
      if (!Array.isArray(entry) && typeof entry === "object") {
        for (const key of Object.keys(entry)) {
          const value = entry[key];
          if (Array.isArray(value)) {
            newEntry[key] = [jsPath].concat(value);
          }
        }
      } else {
        newEntry = [jsPath].concat(entry);
      }
    } catch (err) {
      console.error(err);
    }
    // 修改entry
    compiler.options.entry = newEntry;
  }
  async collectThemeResults() {
    const {
      lessOptions,
      themePath,
      defaultTheme = "default",
      baseVariablePath,
    } = this.options;
    const resultCollector = this.resultCollector;
    const lessThemeFiles = fs
      .readdirSync(themePath)
      .map((filename) => path.join(themePath, filename))
      .filter(async (filepath) => {
        const isAFile = await isFile(filepath);
        const isLess = path.extname(filepath) === "less";
        return isAFile && isLess;
      });
    // 基础
    const baseSource = await readFile(baseVariablePath);
    const baseLessVarsToJs = await lessVarsToJs(baseSource, {
      resolveVariables: true,
      stripPrefix: true,
    });
    // const baseCssVars = Object.keys(baseLessVarsToJs)
    // .map((key) => `--${key}: @${key};`)
    // .join("");
    await Promise.all(
      lessThemeFiles.map(async (filepath) => {
        if(filepath === baseVariablePath) return;

        const fileSource = await readFile(filepath);
        // 将base的变量合并进去
        const result = await lessVarsToJs(fileSource, {
          resolveVariables: true,
          stripPrefix: true,
        });
        // mergedResult：覆盖和新增的总集
        const mergedResult = Object.assign({}, baseLessVarsToJs, result);
        const cssVars = Object.keys(mergedResult)
          .map((key) => `--${key}: @${key};`)
          .join("");
        let tempLess =
          `
          ${baseSource}
          ${
            fileSource.replace(
              /@import .*/,
              ""
            )
          }
          :root {
            ${cssVars}
          }
        `;
            
        let lessResult;
        try {
          lessResult = await less.render(tempLess);
        } catch (e) {
          console.log("less error", tempLess);
        }
        const newLessVars = Object.keys(mergedResult)
          .map((key) => `@${key}: var(--${key});`)
          .join("\n");

        const filename = path.basename(filepath, path.extname(filepath));
        const isDefaultTheme = defaultTheme === filename;
        if (isDefaultTheme) {
          resultCollector.tempDefaultLessVars = newLessVars;
        }
        resultCollector.themes[filename] = lessResult.css;
      })
    );

    this.writeTempJsFile();
    this.writeTempLessFile();
  }
  writeTempLessFile() {
    const defaultLess = this.resultCollector.tempDefaultLessVars;
    fs.writeFileSync(lessPath, defaultLess);
  }
  writeTempJsFile() {
    const { defaultTheme = "default" } = this.options;
    fs.writeFileSync(
      jsPath,
      getThemeCode(
        this.resultCollector.themes,
        defaultTheme
      )
    );
  }
}


const Less2CssThemeLoader = function (source) {
  const prependContent = fs.readFileSync(lessPath, "utf-8");
  source = prependContent + ";" + source;
  return source;
};


module.exports = Less2CssThemeLoader;
module.exports.Less2CssThemePlugin = Less2CssThemePlugin;