const fs = require('fs');
const path = require('path');

const createDirectories = () => {
  const directories = [
    path.join(__dirname, 'tmp', 'uploads'),
    path.join(__dirname, 'tmp', 'generated'),
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Створено директорію: ${dir}`);
    }
  });
};

createDirectories();