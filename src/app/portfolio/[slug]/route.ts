import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { injectPortfolioData } from '@/lib/mapper';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    let portfolioData = null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from('portfolios')
        .select('portfolio_data')
        .eq('slug', slug)
        .single();
        
      if (data) {
        portfolioData = data.portfolio_data;
      }
    } else {
        // Only for demonstration purposes if Supabase is completely unconfigured.
        // But the prompt states: "There must be NO demo fallback. If the slug doesn't exist: return a proper 404 / Portfolio not found message. Do not silently substitute fake data."
        // Thus we strictly enforce portfolioData must be loaded.
    }
    
    if (!portfolioData) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Portfolio Not Found</title>
          <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;} .msg{text-align:center;padding:2rem;background:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}</style>
        </head>
        <body>
          <div class="msg">
             <h1 style="color:#ef4444;margin-top:0;">404 - Portfolio Not Found</h1>
             <p>The requested portfolio does not exist or has been removed.</p>
          </div>
        </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const templatePath = path.join(process.cwd(), 'public', 'template', 'index.html');
    const htmlTemplate = await fs.readFile(templatePath, 'utf-8');

    const finalHtml = injectPortfolioData(htmlTemplate, portfolioData);

    return new NextResponse(finalHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error rendering portfolio:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
