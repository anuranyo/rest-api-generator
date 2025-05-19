const fs = require('fs');
const path = require('path');

const createDirectories = () => {
  const _dirname = path.dirname(__filename);
  
  const directories = [
    path.join(_dirname, '..', 'tmp', 'uploads'),
    path.join(_dirname, '..', 'tmp', 'generated'),
    path.join(_dirname, '..', 'tmp', 'archives'),
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Створено директорію: ${dir}`);
    }
  });
};

createDirectories();

module.exports = {
  createDirectories
};