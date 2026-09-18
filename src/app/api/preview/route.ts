import { NextResponse } from 'next/server';
import { injectPortfolioData } from '@/lib/mapper';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { portfolioData } = await req.json();
    
    if (!portfolioData) {
      return NextResponse.json({ error: 'Missing portfolio data' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'template', 'index.html');
    const htmlTemplate = await fs.readFile(templatePath, 'utf-8');

    const finalHtml = injectPortfolioData(htmlTemplate, portfolioData);

    return new NextResponse(finalHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
