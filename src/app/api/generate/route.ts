import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { portfolioData } = data;
    
    if (!portfolioData) {
      return NextResponse.json({ error: 'Missing portfolio data' }, { status: 400 });
    }

    const baseSlug = portfolioData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug || 'portfolio';
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
       let isUnique = false;
       let suffix = 1;
       while (!isUnique) {
          const { data: existing } = await supabase
            .from('portfolios')
            .select('slug')
            .eq('slug', slug)
            .single();
            
          if (existing) {
             slug = `${baseSlug}-${suffix}`;
             suffix++;
          } else {
             isUnique = true;
          }
       }
       
       const { error } = await supabase.from('portfolios').insert({
         slug,
         portfolio_data: portfolioData
       });
       
       if (error) {
          console.error("Supabase insert error:", error);
       }
    } else {
       slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
    }

    return NextResponse.json({ slug });
  } catch (error) {
    console.error('Error saving portfolio:', error);
    return NextResponse.json({ error: 'Failed to save portfolio' }, { status: 500 });
  }
}
