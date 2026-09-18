export interface Education {
  id?: string;
  degree: string;
  institution: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  dates?: string;
  grade?: string;
  description?: string;
}

export interface Experience {
  id?: string;
  role: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  dates?: string;
  description?: string;
}

export interface Project {
  id?: string;
  name: string;
  technologies: string;
  description: string;
  url?: string;
  github?: string;
  role?: string;
  achievements?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  id?: string;
  name: string;
  proficiency?: string;
}

export interface Skill {
  id?: string;
  name: string;
  level?: string;
}

export interface Achievement {
  id?: string;
  title: string;
  description?: string;
  date?: string;
}

export interface PortfolioData {
  name: string;
  title: string;
  about: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
  languages: Language[];
}
