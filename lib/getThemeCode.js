module.exports = (themesCssVars, defaultTheme) => {
  const themesDataStr = Object.keys(themesCssVars)
    .map((themeKey) => {
      const cssVars = themesCssVars[themeKey];
      return `'${themeKey}': \`${cssVars}\``;
    })
    .join(",");
  return `
const themesData = {
  ${themesDataStr}
};

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
    const styles = \`\${theme}\`;
    appendStyle(styles);
  } else {
    console.warn(\`can not find theme: \${currentTheme}\`);
  }
}

// initialize default theme variables.
// 初始化默认主题变量。
${defaultTheme ? `changeTheme('${defaultTheme}');` : ""}
window.__changeTheme__ = changeTheme;`;
};
