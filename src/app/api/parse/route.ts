import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import * as mammoth from 'mammoth';
import { PortfolioData } from '@/types/portfolio';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';
    
    if (file.name.endsWith('.pdf')) {
      rawText = await new Promise((resolve, reject) => {
        const pdfParser = new (PDFParser as any)();
        pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            let fullText = '';
            if (pdfData && pdfData.Pages) {
                pdfData.Pages.forEach((page: any) => {
                    if (!page.Texts) return;
                    const texts = page.Texts;
                    // Sort by Y-coordinate first to preserve reading order, then by X
                    texts.sort((a: any, b: any) => a.y - b.y || a.x - b.x);
                    
                    let currentY = -1;
                    let currentLine: any[] = [];
                    const lines: any[] = [];
                    
                    texts.forEach((t: any) => {
                        if (currentY === -1 || Math.abs(t.y - currentY) > 0.5) {
                            if (currentLine.length > 0) lines.push(currentLine);
                            currentLine = [t];
                            currentY = t.y;
                        } else {
                            currentLine.push(t);
                        }
                    });
                    if (currentLine.length > 0) lines.push(currentLine);
                    
                    lines.forEach((line: any) => {
                        line.sort((a: any, b: any) => a.x - b.x);
                        const lineStr = line.map((t: any) => {
                            if (t.R && t.R.length > 0) return decodeURIComponent(t.R[0].T);
                            return '';
                        }).join(' ');
                        fullText += lineStr + '\n';
                    });
                });
            } else {
                fullText = (pdfParser as any).getRawTextContent();
            }
            resolve(fullText);
        });
        pdfParser.parseBuffer(buffer);
      });
    } else if (file.name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else if (file.name.endsWith('.txt')) {
      rawText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    console.log("========== RAW RESUME TEXT ==========");
    console.log(rawText);

    // Clean up encoding issues
    let decodedText = rawText.replace(/%[0-9A-F]{2}/gi, match => {
      try { return decodeURIComponent(match); } catch { return match; }
    });
    // Remove invisible weird chars
    decodedText = decodedText.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    let allLines = decodedText.split('\n').map(l => l.trim().replace(/\r/g, '')).filter(l => l.length > 0);

    // Step 1: Remove PDF Garbage
    const cleanLines = allLines.filter(l => {
      const u = l.toUpperCase().trim();
      if (u.startsWith('PAGE ') || u.match(/^\d+\s*\/\s*\d+$/) || u.match(/^\d+\s*PAGE$/) || u.match(/^PAGE\s*\(\d+\)/)) return false;
      if (u.includes('----------------PAGE (0) BREAK----------------') || u.includes('PAGE BREAK')) return false;
      if (u === 'RESUME' || u === 'CURRICULUM VITAE' || u === 'CV') return false;
      return true;
    });

    console.log("========== CLEANED RESUME TEXT ==========");
    console.log(cleanLines.join('\n'));

    const parsedData: PortfolioData = {
      name: '', title: '', about: '', email: '', phone: '', location: '',
      linkedin: '', github: '', website: '',
      skills: [], education: [], experience: [], projects: [],
      certifications: [], achievements: [], languages: []
    };

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const linkedinRegex = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w\-]+/i;
    const githubRegex = /(https?:\/\/)?(www\.)?github\.com\/[\w\-]+/i;
    const dateRangeRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4})\s*[-–to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4}|Present|Current)/i;

    // Step 2: Name & Contact Extraction from Header
    // Scan top 20 lines for contact and name
    for (let i = 0; i < Math.min(20, cleanLines.length); i++) {
       const line = cleanLines[i];
       const u = line.toUpperCase();
       
       if (u.includes('UNIVERSITY') || u.includes('COLLEGE') || u.includes('INSTITUTE') || u.includes('ACADEMY') || u.includes('B.TECH') || u.includes('B.E.') || u.includes('BACHELOR') || u.includes('MASTER') || u.includes('M.SC') || u.includes('M.TECH') || u.includes('PAGE') || u.includes('HTTP') || u.includes('WWW') || u.includes('@')) {
          continue;
       }
       if (['SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE', 'EDUCATION', 'EXPERIENCE', 'PROJECTS'].includes(u.replace(/[^A-Z\s]/g, '').trim())) {
          continue;
       }

       if (!parsedData.name) {
          const wordCount = line.split(/\s+/).length;
          if (wordCount >= 1 && wordCount <= 4 && line.length > 2 && line.length < 40) {
             let potentialName = line.replace(/[0-9]/g, '').replace(/[\/\\|\?]/g, '').trim();
             if (potentialName.length > 2) {
                 parsedData.name = potentialName;
             }
          }
       }
    }

    // Step 3: Global Contact Extraction
    cleanLines.forEach(line => {
      const eMatch = line.match(emailRegex);
      if (eMatch && !parsedData.email) parsedData.email = eMatch[0];
      const pMatch = line.match(phoneRegex);
      if (pMatch && pMatch[0].length >= 10 && !parsedData.phone) parsedData.phone = pMatch[0].replace(/[^0-9+]/g, '');
      const lMatch = line.match(linkedinRegex);
      if (lMatch && !parsedData.linkedin) parsedData.linkedin = lMatch[0];
      const gMatch = line.match(githubRegex);
      if (gMatch && !parsedData.github) parsedData.github = gMatch[0];
    });

    // Step 4: Section Detection
    const sectionBlocks: Record<string, string[]> = {
      about: [], education: [], experience: [], projects: [], skills: [], certifications: [], achievements: [], languages: [], header: []
    };

    const isSectionHeader = (text: string) => {
      const t = text.replace(/[^A-Z\s]/g, '').trim();
      if (t.length > 30) return null; // Too long to be a header
      if (['SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE', 'OBJECTIVE', 'CAREER OBJECTIVE', 'ABOUT ME'].includes(t)) return 'about';
      if (['EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT', 'INTERNSHIP', 'INTERNSHIPS', 'WORK HISTORY'].includes(t)) return 'experience';
      if (['EDUCATION', 'ACADEMIC BACKGROUND', 'ACADEMICS', 'EDUCATIONAL QUALIFICATIONS', 'QUALIFICATIONS', 'EDUCATIONAL BACKGROUND'].includes(t)) return 'education';
      if (['PROJECTS', 'PERSONAL PROJECTS', 'ACADEMIC PROJECTS', 'KEY PROJECTS', 'SELECTED PROJECTS'].includes(t)) return 'projects';
      if (['SKILLS', 'TECHNICAL SKILLS', 'CORE SKILLS', 'TECHNICAL EXPERTISE', 'EXPERTISE', 'SOFT SKILLS'].includes(t)) return 'skills';
      if (['CERTIFICATIONS', 'CERTIFICATES', 'LICENSES', 'LICENSES AND CERTIFICATIONS', 'PROFESSIONAL CERTIFICATIONS'].includes(t)) return 'certifications';
      if (['ACHIEVEMENTS', 'AWARDS', 'HONORS', 'ACCOMPLISHMENTS', 'RECOGNITION'].includes(t)) return 'achievements';
      if (['LANGUAGES', 'LANGUAGE PROFICIENCY'].includes(t)) return 'languages';
      return null;
    };

    let currentSection = 'header';

    cleanLines.forEach(line => {
      const header = isSectionHeader(line);
      if (header) {
        currentSection = header;
        return; // skip the header line itself
      }
      
      // Do not put pure contact lines into blocks
      if (line.match(emailRegex) || line.match(phoneRegex) || line.match(linkedinRegex) || line.match(githubRegex)) {
         // Unless we are in projects, where it might be a github repo link
         if (currentSection !== 'projects') return;
      }
      
      // Do not put the name line into blocks
      if (parsedData.name && line.includes(parsedData.name)) return;

      if (currentSection !== 'header') {
         sectionBlocks[currentSection].push(line);
      }
    });

    console.log("========== DETECTED SECTION BLOCKS ==========");
    console.log(JSON.stringify(sectionBlocks, null, 2));

    // Step 5: Individual Entry Parsing from Blocks
    
    // ABOUT
    parsedData.about = sectionBlocks.about.join('\n').trim();

    // EDUCATION
    let eduCurrent: any = null;
    sectionBlocks.education.forEach(line => {
       const u = line.toUpperCase();
       // Education entry trigger
       if (u.includes('B.TECH') || u.includes('B.E.') || u.includes('BACHELOR') || u.includes('B.SC') || u.includes('MASTER') || u.includes('M.TECH') || u.includes('M.SC') || u.includes('DIPLOMA') || u.includes('SSC') || u.includes('INTERMEDIATE') || u.includes('UNIVERSITY') || u.includes('COLLEGE') || u.includes('INSTITUTE') || u.includes('SCHOOL')) {
           if (eduCurrent) parsedData.education.push(eduCurrent);
           eduCurrent = { degree: '', institution: line, dates: '', description: '' };
           // If the line has B.TECH, extract it as degree
           if (u.includes('B.TECH') || u.includes('BACHELOR') || u.includes('SSC') || u.includes('INTERMEDIATE')) {
              eduCurrent.degree = line;
              eduCurrent.institution = ''; // Will get next line
           }
       } else if (eduCurrent) {
           const dMatch = line.match(dateRangeRegex);
           if (dMatch && !eduCurrent.dates) {
               eduCurrent.dates = dMatch[0];
               eduCurrent.description += line.replace(dMatch[0], '') + '\n';
           } else if (!eduCurrent.institution && !eduCurrent.degree) {
               eduCurrent.institution = line;
           } else if (!eduCurrent.degree) {
               eduCurrent.degree = line;
           } else {
               eduCurrent.description += line + '\n';
           }
       } else {
           // fallback if no clear trigger
           eduCurrent = { degree: line, institution: '', dates: '', description: '' };
       }
    });
    if (eduCurrent) parsedData.education.push(eduCurrent);

    // EXPERIENCE
    let expCurrent: any = null;
    sectionBlocks.experience.forEach(line => {
       const dMatch = line.match(dateRangeRegex);
       if (dMatch || line.toUpperCase().includes('PRESENT') || line.toUpperCase().includes('CURRENT')) {
           if (expCurrent) parsedData.experience.push(expCurrent);
           expCurrent = { role: line.replace(dMatch?.[0]||'', '').trim(), company: '', dates: dMatch?.[0]||'', description: '' };
       } else if (expCurrent) {
           if (!expCurrent.company) expCurrent.company = line;
           else expCurrent.description += line + '\n';
       } else {
           expCurrent = { role: line, company: '', dates: '', description: '' };
       }
    });
    if (expCurrent) parsedData.experience.push(expCurrent);

    // PROJECTS
    let projCurrent: any = null;
    sectionBlocks.projects.forEach(line => {
       const gMatch = line.match(githubRegex);
       if (gMatch || line.toUpperCase().includes('PROJECT') || line.toUpperCase().includes('APPLICATION') || line.toUpperCase().includes('SYSTEM')) {
           if (projCurrent) parsedData.projects.push(projCurrent);
           projCurrent = { name: line.replace(gMatch?.[0]||'', '').trim(), technologies: '', github: gMatch?.[0]||'', url: '', description: '' };
       } else if (projCurrent) {
           if (line.toUpperCase().includes('TOOLS') || line.toUpperCase().includes('TECHNOLOGIES')) {
               projCurrent.technologies += line + ' ';
           } else {
               projCurrent.description += line + '\n';
           }
       } else {
           projCurrent = { name: line, technologies: '', github: '', url: '', description: '' };
       }
    });
    if (projCurrent) parsedData.projects.push(projCurrent);

    // SKILLS
    const rawSkills = sectionBlocks.skills.join('\n').split(/[\n|•,]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
    rawSkills.forEach(s => {
       // Clean up weird colons like "LANGUAGES: Java" -> "Java"
       const cleaned = s.includes(':') ? s.split(':')[1].trim() : s;
       if (cleaned && !parsedData.skills.find(sk => sk.name === cleaned)) {
           parsedData.skills.push({ name: cleaned });
       }
    });

    // CERTIFICATIONS
    sectionBlocks.certifications.forEach(line => {
       if (line.trim().length > 3) parsedData.certifications.push({ name: line, issuer: '', date: '', url: '' });
    });

    // ACHIEVEMENTS
    sectionBlocks.achievements.forEach(line => {
       if (line.trim().length > 3) parsedData.achievements.push({ title: line, description: '' });
    });

    // LANGUAGES
    const rawLangs = sectionBlocks.languages.join('\n').split(/[\n|,]/).map(s => s.trim()).filter(s => s.length > 1);
    rawLangs.forEach(s => parsedData.languages.push({ name: s, proficiency: '' }));

    // CLEANUP
    // Trim all descriptions
    parsedData.education.forEach(e => e.description = e.description?.trim());
    parsedData.experience.forEach(e => e.description = e.description?.trim());
    parsedData.projects.forEach(p => p.description = p.description?.trim());

    console.log("========== FINAL PARSED DATA ==========");
    console.log(JSON.stringify(parsedData, null, 2));

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error parsing file:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
