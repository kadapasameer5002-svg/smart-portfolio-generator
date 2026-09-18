'use client';
import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Save, Download, Plus, Trash2, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { PortfolioData } from '@/types/portfolio';

const EMPTY_DATA: PortfolioData = {
  name: '', title: '', about: '', email: '', phone: '', location: '',
  linkedin: '', github: '', website: '',
  skills: [], education: [], experience: [], projects: [],
  certifications: [], achievements: [], languages: []
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setStatus('Parsing resume...');
      
      const formData = new FormData();
      formData.append('resume', selected);
      
      try {
        const res = await fetch('/api/parse', { method: 'POST', body: formData });
        if (res.ok) {
          const parsed = await res.json();
          setData(parsed);
          setStatus('Resume extracted successfully. Please review and refine the sections below.');
        } else {
          setStatus('Failed to extract resume.');
        }
      } catch (err) {
        setStatus('Error extracting resume.');
      }
    }
  };

  const handleUpdatePreview = async () => {
    if (!data) return;
    setStatus('Updating preview...');
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData: data })
      });
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
        setStatus('Preview updated!');
      }
    } catch (err) {
      setStatus('Error updating preview.');
    }
  };

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml]);

  const handleSave = async () => {
    if (!data) return;
    setStatus('Saving portfolio...');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData: data })
      });
      if (res.ok) {
        const result = await res.json();
        setSlug(result.slug);
        setStatus('Portfolio Published Successfully!');
      } else {
        setStatus('Failed to save portfolio.');
      }
    } catch (err) {
      setStatus('Error saving portfolio.');
    }
  };

  const handleDownload = async () => {
     if (!data) return;
     try {
       const res = await fetch('/api/download', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ portfolioData: data })
       });
       if (res.ok) {
         const blob = await res.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = 'portfolio.html';
         document.body.appendChild(a);
         a.click();
         a.remove();
       }
     } catch(err) {
       console.error(err);
     }
  };

  const updateField = (field: keyof PortfolioData, value: any) => {
    setData(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Portfolio Generator</h1>
          <p className="text-gray-600 mb-6">Upload your resume to automatically structure your data into a stunning, professional portfolio.</p>
          
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center rounded-lg cursor-pointer hover:bg-blue-100 transition relative">
            <input type="file" onChange={handleFileUpload} accept=".pdf,.docx,.txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <span className="text-blue-700 font-semibold">{file ? file.name : "Click or drag resume here"}</span>
          </div>
          
          {status && (
            <div className="mt-4 p-4 rounded bg-indigo-50 text-indigo-700 flex items-center gap-2 font-medium">
              <CheckCircle className="h-5 w-5" />
              {status}
            </div>
          )}

          {slug && (
            <div className="mt-4 p-4 rounded bg-green-50 border border-green-200 text-green-800 font-medium space-y-2">
               <p className="font-bold">Portfolio Published Successfully!</p>
               <div className="flex items-center gap-4 bg-white p-2 rounded border">
                 <span className="truncate flex-1 font-mono text-sm">{window.location.origin}/portfolio/{slug}</span>
                 <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portfolio/${slug}`)} className="text-gray-600 hover:text-gray-800" title="Copy Link"><Copy size={18}/></button>
                 <a href={`/portfolio/${slug}`} target="_blank" className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><ExternalLink size={18}/> Open</a>
               </div>
            </div>
          )}
          
          {!data && <div className="mt-4"><button onClick={() => setData(EMPTY_DATA)} className="text-blue-600 underline">Start from scratch instead</button></div>}
        </div>

        {data && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200 h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b pb-2 mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Review & Edit Data</h2>
                <span className="text-sm text-gray-500">Ensure data is perfectly separated</span>
              </div>
              
              <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                {/* Personal Info */}
                <section className="space-y-3">
                  <h3 className="font-bold text-lg bg-gray-100 p-2 rounded">Personal Info</h3>
                  <div><label className="block text-sm font-semibold">Full Name</label>
                    <input type="text" value={data.name} onChange={e => updateField('name', e.target.value)} className="w-full border rounded p-2" /></div>
                  <div><label className="block text-sm font-semibold">Professional Title</label>
                    <input type="text" value={data.title} onChange={e => updateField('title', e.target.value)} className="w-full border rounded p-2" /></div>
                  <div><label className="block text-sm font-semibold text-blue-600">Professional Summary (About)</label>
                    <textarea rows={4} value={data.about} onChange={e => updateField('about', e.target.value)} className="w-full border rounded p-2 border-blue-200 bg-blue-50" placeholder="Only your professional summary. NO contact info or unrelated lists." /></div>
                </section>

                {/* Contact */}
                <section className="space-y-3">
                  <h3 className="font-bold text-lg bg-gray-100 p-2 rounded">Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold">Email</label>
                      <input type="email" value={data.email} onChange={e => updateField('email', e.target.value)} className="w-full border rounded p-2" /></div>
                    <div><label className="block text-sm font-semibold">Phone</label>
                      <input type="text" value={data.phone} onChange={e => updateField('phone', e.target.value)} className="w-full border rounded p-2" /></div>
                    <div><label className="block text-sm font-semibold">Location</label>
                      <input type="text" value={data.location} onChange={e => updateField('location', e.target.value)} className="w-full border rounded p-2" /></div>
                    <div><label className="block text-sm font-semibold">Website</label>
                      <input type="text" value={data.website} onChange={e => updateField('website', e.target.value)} className="w-full border rounded p-2" /></div>
                    <div className="col-span-2"><label className="block text-sm font-semibold">LinkedIn URL</label>
                      <input type="text" value={data.linkedin} onChange={e => updateField('linkedin', e.target.value)} className="w-full border rounded p-2" /></div>
                    <div className="col-span-2"><label className="block text-sm font-semibold">GitHub URL</label>
                      <input type="text" value={data.github} onChange={e => updateField('github', e.target.value)} className="w-full border rounded p-2" /></div>
                  </div>
                </section>

                {/* Skills */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Skills & Technologies</h3>
                    <button onClick={() => updateField('skills', [...data.skills, { name: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {data.skills.map((s, i) => (
                      <div key={i} className="flex border rounded bg-white relative pr-6">
                        <input value={s.name} onChange={e => { const arr = [...data.skills]; arr[i].name = e.target.value; updateField('skills', arr); }} className="w-full p-1 text-sm outline-none" placeholder="Skill" />
                        <button onClick={() => updateField('skills', data.skills.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Experience */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Experience</h3>
                    <button onClick={() => updateField('experience', [...data.experience, { role: '', company: '', dates: '', description: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  {data.experience.map((exp, i) => (
                    <div key={i} className="border bg-white p-3 rounded mb-2 relative">
                       <button onClick={() => updateField('experience', data.experience.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                       <input placeholder="Job Title" value={exp.role} onChange={e => { const arr = [...data.experience]; arr[i].role = e.target.value; updateField('experience', arr); }} className="w-full border-b p-1 mb-1 font-bold text-sm outline-none" />
                       <div className="grid grid-cols-2 gap-2">
                         <input placeholder="Company" value={exp.company} onChange={e => { const arr = [...data.experience]; arr[i].company = e.target.value; updateField('experience', arr); }} className="w-full border-b p-1 mb-1 text-sm outline-none" />
                         <input placeholder="Location" value={exp.location || ''} onChange={e => { const arr = [...data.experience]; arr[i].location = e.target.value; updateField('experience', arr); }} className="w-full border-b p-1 mb-1 text-sm outline-none" />
                       </div>
                       <input placeholder="Dates (e.g. 2020 - Present)" value={exp.dates || ''} onChange={e => { const arr = [...data.experience]; arr[i].dates = e.target.value; updateField('experience', arr); }} className="w-full border-b p-1 mb-1 text-sm text-gray-500 outline-none" />
                       <textarea placeholder="Description & Responsibilities..." value={exp.description || ''} onChange={e => { const arr = [...data.experience]; arr[i].description = e.target.value; updateField('experience', arr); }} className="w-full border rounded p-2 text-sm outline-none mt-1" rows={4} />
                    </div>
                  ))}
                </section>
                
                {/* Education */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Education</h3>
                    <button onClick={() => updateField('education', [...data.education, { degree: '', institution: '', dates: '', description: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  {data.education.map((edu, i) => (
                    <div key={i} className="border bg-white p-3 rounded mb-2 relative">
                       <button onClick={() => updateField('education', data.education.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                       <input placeholder="Degree / Qualification" value={edu.degree} onChange={e => { const arr = [...data.education]; arr[i].degree = e.target.value; updateField('education', arr); }} className="w-full border-b p-1 mb-1 font-bold text-sm outline-none" />
                       <input placeholder="Institution" value={edu.institution} onChange={e => { const arr = [...data.education]; arr[i].institution = e.target.value; updateField('education', arr); }} className="w-full border-b p-1 mb-1 text-sm outline-none" />
                       <input placeholder="Dates" value={edu.dates || ''} onChange={e => { const arr = [...data.education]; arr[i].dates = e.target.value; updateField('education', arr); }} className="w-full border-b p-1 mb-1 text-sm text-gray-500 outline-none" />
                       <textarea placeholder="Description & Coursework..." value={edu.description || ''} onChange={e => { const arr = [...data.education]; arr[i].description = e.target.value; updateField('education', arr); }} className="w-full border rounded p-2 text-sm outline-none mt-1" rows={3} />
                    </div>
                  ))}
                </section>

                {/* Projects */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Projects</h3>
                    <button onClick={() => updateField('projects', [...data.projects, { name: '', technologies: '', description: '', url: '', github: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  {data.projects.map((proj, i) => (
                    <div key={i} className="border bg-white p-3 rounded mb-2 relative">
                       <button onClick={() => updateField('projects', data.projects.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                       <input placeholder="Project Name" value={proj.name} onChange={e => { const arr = [...data.projects]; arr[i].name = e.target.value; updateField('projects', arr); }} className="w-full border-b p-1 mb-1 font-bold text-sm outline-none" />
                       <input placeholder="Technologies Used" value={proj.technologies} onChange={e => { const arr = [...data.projects]; arr[i].technologies = e.target.value; updateField('projects', arr); }} className="w-full border-b p-1 mb-1 text-sm outline-none" />
                       <div className="grid grid-cols-2 gap-2">
                         <input placeholder="Live URL" value={proj.url || ''} onChange={e => { const arr = [...data.projects]; arr[i].url = e.target.value; updateField('projects', arr); }} className="w-full border-b p-1 mb-1 text-sm text-blue-500 outline-none" />
                         <input placeholder="GitHub URL" value={proj.github || ''} onChange={e => { const arr = [...data.projects]; arr[i].github = e.target.value; updateField('projects', arr); }} className="w-full border-b p-1 mb-1 text-sm text-blue-500 outline-none" />
                       </div>
                       <textarea placeholder="Description & Features..." value={proj.description} onChange={e => { const arr = [...data.projects]; arr[i].description = e.target.value; updateField('projects', arr); }} className="w-full border rounded p-2 text-sm outline-none mt-1" rows={3} />
                    </div>
                  ))}
                </section>

                {/* Certifications */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Certifications</h3>
                    <button onClick={() => updateField('certifications', [...data.certifications, { name: '', issuer: '', date: '', url: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  {data.certifications.map((cert, i) => (
                    <div key={i} className="border bg-white p-3 rounded mb-2 relative">
                       <button onClick={() => updateField('certifications', data.certifications.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                       <input placeholder="Certification Name" value={cert.name} onChange={e => { const arr = [...data.certifications]; arr[i].name = e.target.value; updateField('certifications', arr); }} className="w-full border-b p-1 mb-1 font-bold text-sm outline-none" />
                       <input placeholder="Issuing Organization" value={cert.issuer} onChange={e => { const arr = [...data.certifications]; arr[i].issuer = e.target.value; updateField('certifications', arr); }} className="w-full border-b p-1 mb-1 text-sm outline-none" />
                       <div className="grid grid-cols-2 gap-2">
                         <input placeholder="Date" value={cert.date || ''} onChange={e => { const arr = [...data.certifications]; arr[i].date = e.target.value; updateField('certifications', arr); }} className="w-full border-b p-1 mb-1 text-sm outline-none" />
                         <input placeholder="Credential URL" value={cert.url || ''} onChange={e => { const arr = [...data.certifications]; arr[i].url = e.target.value; updateField('certifications', arr); }} className="w-full border-b p-1 mb-1 text-sm text-blue-500 outline-none" />
                       </div>
                    </div>
                  ))}
                </section>

                {/* Achievements */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Achievements</h3>
                    <button onClick={() => updateField('achievements', [...data.achievements, { title: '', description: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  {data.achievements.map((ach, i) => (
                    <div key={i} className="border bg-white p-3 rounded mb-2 relative">
                       <button onClick={() => updateField('achievements', data.achievements.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                       <input placeholder="Achievement Title" value={ach.title} onChange={e => { const arr = [...data.achievements]; arr[i].title = e.target.value; updateField('achievements', arr); }} className="w-full border-b p-1 mb-1 font-bold text-sm outline-none" />
                       <textarea placeholder="Description..." value={ach.description || ''} onChange={e => { const arr = [...data.achievements]; arr[i].description = e.target.value; updateField('achievements', arr); }} className="w-full border rounded p-2 text-sm outline-none mt-1" rows={2} />
                    </div>
                  ))}
                </section>

                {/* Languages */}
                <section className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Languages</h3>
                    <button onClick={() => updateField('languages', [...data.languages, { name: '', proficiency: '' }])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {data.languages.map((lang, i) => (
                      <div key={i} className="flex border rounded bg-white relative pr-6">
                        <input value={lang.name} onChange={e => { const arr = [...data.languages]; arr[i].name = e.target.value; updateField('languages', arr); }} className="w-1/2 p-1 text-sm border-r outline-none" placeholder="Language" />
                        <input value={lang.proficiency || ''} onChange={e => { const arr = [...data.languages]; arr[i].proficiency = e.target.value; updateField('languages', arr); }} className="w-1/2 p-1 text-sm outline-none" placeholder="Proficiency" />
                        <button onClick={() => updateField('languages', data.languages.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
              
              <div className="pt-4 mt-auto grid grid-cols-2 gap-2 flex-shrink-0 border-t">
                <button onClick={handleUpdatePreview} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition">
                  <RefreshCw className="h-5 w-5" /> Update Preview
                </button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition">
                  <Save className="h-5 w-5" /> Save Public
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-800">Live Preview</h2>
                 <div className="flex gap-2">
                    <button onClick={handleDownload} className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1 shadow"><Download className="h-4 w-4"/> HTML Export</button>
                 </div>
              </div>
              <div className="flex-1 bg-gray-50 border rounded-lg overflow-hidden relative shadow-inner">
                {!previewHtml ? (
                   <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col gap-2 p-8 text-center">
                     <FileText className="h-16 w-16 text-blue-200" />
                     <p className="font-semibold text-gray-600">Preview is empty</p>
                     <p className="text-sm">Make edits in the form and click "Update Preview" to render your actual design in real-time.</p>
                   </div>
                ) : (
                   <iframe ref={iframeRef} className="w-full h-full border-none bg-white" title="Portfolio Preview" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
