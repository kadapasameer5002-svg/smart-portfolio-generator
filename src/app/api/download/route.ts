import { NextResponse } from 'next/server';
import { injectPortfolioData } from '@/lib/mapper';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

async function inlineHTML(html: string): Promise<string> {
  const $ = cheerio.load(html);
  const templateDir = path.join(process.cwd(), 'public');

  // Inline CSS
  const links = $('link[rel="stylesheet"]').toArray();
  for (const el of links) {
    let href = $(el).attr('href');
    if (href && href.startsWith('/template/')) {
       try {
          const filePath = path.join(templateDir, href);
          let cssContent = await fs.readFile(filePath, 'utf-8');
          
          // Handle url(...) in CSS
          const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
          let match;
          const cssDir = path.dirname(filePath);
          
          let modifiedCssContent = cssContent;
          
          while ((match = urlRegex.exec(cssContent)) !== null) {
              const assetUrl = match[1];
              if (assetUrl.startsWith('http') || assetUrl.startsWith('data:')) continue;
              try {
                  const assetPath = path.resolve(cssDir, assetUrl);
                  const assetData = await fs.readFile(assetPath);
                  const ext = path.extname(assetPath).toLowerCase();
                  let mimeType = 'application/octet-stream';
                  if (ext === '.woff2') mimeType = 'font/woff2';
                  else if (ext === '.woff') mimeType = 'font/woff';
                  else if (ext === '.ttf') mimeType = 'font/ttf';
                  else if (ext === '.eot') mimeType = 'application/vnd.ms-fontobject';
                  else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                  else if (ext === '.png') mimeType = 'image/png';
                  else if (ext === '.gif') mimeType = 'image/gif';
                  else if (ext === '.svg') mimeType = 'image/svg+xml';
                  
                  const base64 = assetData.toString('base64');
                  const dataUrl = `data:${mimeType};base64,${base64}`;
                  modifiedCssContent = modifiedCssContent.split(match[0]).join(`url('${dataUrl}')`);
              } catch (e) {
                  console.error('Could not inline CSS asset:', assetUrl);
              }
          }
          $('<style>').text(modifiedCssContent).insertBefore(el);
          $(el).remove();
       } catch (e) {
          console.error('Failed to inline CSS:', href);
       }
    }
  }

  // Inline JS
  const scripts = $('script[src]').toArray();
  for (const el of scripts) {
    let src = $(el).attr('src');
    if (src && src.startsWith('/template/')) {
       try {
          const filePath = path.join(templateDir, src);
          const jsContent = await fs.readFile(filePath, 'utf-8');
          $('<script>').text(jsContent).insertBefore(el);
          $(el).remove();
       } catch (e) {
          console.error('Failed to inline JS:', src);
       }
    }
  }

  // Inline Images
  const imgs = $('img[src]').toArray();
  for (const el of imgs) {
    let src = $(el).attr('src');
    if (src && src.startsWith('/template/')) {
       try {
          const filePath = path.join(templateDir, src);
          const imgData = await fs.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase();
          let mimeType = 'image/jpeg';
          if (ext === '.png') mimeType = 'image/png';
          else if (ext === '.gif') mimeType = 'image/gif';
          else if (ext === '.svg') mimeType = 'image/svg+xml';
          
          const base64 = imgData.toString('base64');
          $(el).attr('src', `data:${mimeType};base64,${base64}`);
       } catch (e) {
          console.error('Failed to inline IMG:', src);
       }
    }
  }
  
  // Background Images inside inline styles
  const elementsWithStyle = $('[style]').toArray();
  for (const el of elementsWithStyle) {
    let style = $(el).attr('style') || '';
    if (style.includes('url(') && style.includes('/template/')) {
       const urlRegex = /url\(['"]?(\/template\/[^'"()]+)['"]?\)/g;
       let match;
       while ((match = urlRegex.exec(style)) !== null) {
           const assetUrl = match[1];
           try {
              const filePath = path.join(templateDir, assetUrl);
              const imgData = await fs.readFile(filePath);
              const ext = path.extname(filePath).toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === '.png') mimeType = 'image/png';
              
              const base64 = imgData.toString('base64');
              style = style.split(assetUrl).join(`data:${mimeType};base64,${base64}`);
           } catch (e) {
              console.error('Failed to inline background image:', assetUrl);
           }
       }
       $(el).attr('style', style);
    }
  }

  return $.html();
}

export async function POST(req: Request) {
  try {
    const { portfolioData } = await req.json();
    
    const templatePath = path.join(process.cwd(), 'public', 'template', 'index.html');
    const htmlTemplate = await fs.readFile(templatePath, 'utf-8');

    // 1. Inject data into base template (This matches Live Preview mapping exactly)
    const baseHtml = injectPortfolioData(htmlTemplate, portfolioData);
    
    // 2. Perform extreme inlining of all assets to make it work offline!
    const inlinedHtml = await inlineHTML(baseHtml);

    return new NextResponse(inlinedHtml, {
      status: 200,
      headers: {
         'Content-Type': 'text/html;charset=utf-8',
         'Content-Disposition': 'attachment; filename="portfolio.html"'
      }
    });
  } catch (error) {
    console.error('Error downloading portfolio:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
