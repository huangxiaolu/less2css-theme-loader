const fs = require('fs').promises;

const isFile = async (pathString) => {
  const stat = await fs.lstat(pathString);
  try {
    return await stat.isFile();
  } catch(e) {
    return false
  }
}

const readFile = async (pathString) => {
  try {
    const data = await fs.readFile(pathString, 'utf-8');
    return data;
  } catch(e) {
    return "";
  }
}

module.exports = {
  isFile,
  readFile
} 