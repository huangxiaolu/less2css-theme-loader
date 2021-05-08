module.exports = (themesCssVars, defaultTheme, baseCss) => {
  const themesDataStr = Object.keys(themesCssVars)
    .map((themeKey) => {
      const cssVars = themesCssVars[themeKey];
      return `'${themeKey}': \`${cssVars}\``;
    })
    .join(",");
  const baseDataStr = `\`${baseCss}\``;
  return `
const baseData=${baseDataStr};
const themesData = {
  ${themesDataStr}
};

function initBaseStyle() {
  let baseStyle = null;
  baseStyle = document.createElement('style');
  baseStyle.type = 'text/css';
  baseStyle.appendChild(document.createTextNode(baseData));
  document.getElementsByTagName('head')[0].appendChild(baseStyle);
}

let style;
function appendStyle(styles) {
  if (style) style.remove();
  style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(styles));
  document.getElementsByTagName('head')[0].appendChild(style);
}

// runtime theme changing function
// 运行时切换主题的方法
function changeTheme(currentTheme) {
  // Get current theme
  const theme = themesData[currentTheme];
  if (theme !== undefined) {
    // Declare the style element
    const styles = \`\${theme}\`;
    // Function call
    appendStyle(styles);
  } else {
    console.warn(\`can not find theme: \${currentTheme}\`);
  }
}

// initialize base css variables. 
// 初始化基础变量。
${baseDataStr ? `initBaseStyle();`: ""}

// initialize default theme variables.
// 初始化默认主题变量。
${defaultTheme ? `changeTheme('${defaultTheme}');` : ""}
window.__changeTheme__ = changeTheme;`;
};
