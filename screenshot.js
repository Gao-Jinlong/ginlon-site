const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 设置桌面端尺寸
    console.log('生成桌面端设计稿...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`file://${__dirname}/design-preview.html`, {
      waitUntil: 'networkidle0'
    });
    await page.screenshot({
      path: 'design-desktop.png',
      fullPage: true
    });
    console.log('✓ 桌面端设计稿已生成: design-desktop.png');

    // 设置移动端尺寸
    console.log('生成移动端设计稿...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`file://${__dirname}/design-preview.html`, {
      waitUntil: 'networkidle0'
    });
    await page.screenshot({
      path: 'design-mobile.png',
      fullPage: true
    });
    console.log('✓ 移动端设计稿已生成: design-mobile.png');

    await browser.close();
    console.log('\n✓ 所有设计稿生成完成！');
    console.log('文件位置:');
    console.log('  - design-desktop.png (1920x1080)');
    console.log('  - design-mobile.png (375x667)');

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('\n尝试替代方案...');
    console.log('1. 在浏览器中打开 design-preview.html');
    console.log('2. 使用浏览器截图工具');
    console.log('   macOS: Cmd + Shift + 4');
    console.log('   Windows: Win + Shift + S');
  }
})();
