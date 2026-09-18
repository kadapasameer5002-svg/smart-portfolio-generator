import * as cheerio from 'cheerio';
import { PortfolioData } from '../types/portfolio';

export function injectPortfolioData(html: string, data: PortfolioData): string {
  const $ = cheerio.load(html);

  // Update asset links to absolute /template/ paths
  $('[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('/') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      $(el).attr('href', '/template/' + href);
    }
  });
  $('[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
      $(el).attr('src', '/template/' + src);
    }
  });

  // WIPE ALL ORIGINAL HARDCODED DATA TO PREVENT BLEED-THROUGH
  // Remove existing paragraphs in About section to get rid of hardcoded bio
  $('.about-info').parent().find('p').remove(); 
  
  // Name
  if (data.name) {
    $('.navbar-brand').text(data.name);
    $('.hero-wrap h1').html(`I'm <span style="color: #3e64ff;">${data.name}</span>`);
    $('.about-info li:contains("Name:") span:last-child').text(data.name);
  } else {
    $('.navbar-brand').empty();
    $('.hero-wrap h1').empty();
    $('.about-info li:contains("Name:")').remove();
  }

  // Title
  if (data.title) {
    $('.hero-wrap .txt-rotate').attr('data-rotate', JSON.stringify([data.title, data.title]));
    $('.hero-wrap .txt-rotate').text(data.title);
  } else {
    $('.hero-wrap h2').remove();
  }

  // About
  if (data.about) {
    $('.about-info').before(`<p class="injected-about" style="white-space: pre-wrap; font-size: 1.1rem; line-height: 1.8;">${data.about}</p>`);
  }

  // Contact
  if (data.email) {
    $('.about-info li:contains("Email:") span:last-child').text(data.email);
    $('.contact-info .icon-paper-plane').parent().next().find('a').text(data.email).attr('href', 'mailto:' + data.email);
  } else {
    $('.about-info li:contains("Email:")').remove();
    $('.contact-info .icon-paper-plane').parent().parent().remove();
  }

  if (data.phone) {
    $('.about-info li:contains("Phone:") span:last-child').text(data.phone);
    $('.contact-info .icon-phone2').parent().next().find('a').text(data.phone).attr('href', 'tel:' + data.phone);
  } else {
    $('.about-info li:contains("Phone:")').remove();
    $('.contact-info .icon-phone2').parent().parent().remove();
  }

  if (data.location) {
    const countryLi = $('.about-info li:contains("Country:")');
    if (countryLi.length > 0) {
      countryLi.find('span:first-child').text('Location:');
      countryLi.find('span:last-child').text(data.location);
    } else {
       $('.about-info').append(`<li class="d-flex"><span>Location:</span> <span>${data.location}</span></li>`);
    }
    $('.about-info li:contains("City:")').remove();
  } else {
    $('.about-info li:contains("Country:")').remove();
    $('.about-info li:contains("City:")').remove();
  }

  if (data.website) {
    $('.contact-info .icon-globe').parent().next().find('a').text(data.website).attr('href', data.website.startsWith('http') ? data.website : 'https://' + data.website);
  } else {
    $('.contact-info .icon-globe').parent().parent().remove();
  }

  // Clean Social Footer
  const socialUl = $('.ftco-footer-social');
  socialUl.empty();
  if (data.github) {
    const ghUrl = data.github.startsWith('http') ? data.github : 'https://' + data.github;
    socialUl.append(`<li class="ftco-animate fadeInUp ftco-animated"><a href="${ghUrl}" target="_blank"><span class="icon-github"></span></a></li>`);
  }
  if (data.linkedin) {
    const lnUrl = data.linkedin.startsWith('http') ? data.linkedin : 'https://' + data.linkedin;
    socialUl.append(`<li class="ftco-animate fadeInUp ftco-animated"><a href="${lnUrl}" target="_blank"><span class="icon-linkedin-square"></span></a></li>`);
  }
  if (!data.github && !data.linkedin) {
    $('.contact-info .icon-github').parent().parent().remove();
    $('.contact-info .icon-linkedin').parent().parent().remove();
  }

  // Education
  const eduContainer = $('#page-1');
  eduContainer.empty();
  if (data.education && data.education.length > 0) {
    eduContainer.append('<h2 class="heading">Education</h2>');
    data.education.forEach(edu => {
      const dates = edu.dates || (edu.startDate ? `${edu.startDate} - ${edu.endDate || ''}` : '');
      eduContainer.append(`
        <div class="resume-wrap d-flex ftco-animate fadeInUp ftco-animated">
          <div class="icon d-flex align-items-center justify-content-center">
            <span class="flaticon-graduation-cap"></span>
          </div>
          <div class="text pl-3">
            <h2>${edu.institution}</h2>
            <span class="position">${edu.degree} ${edu.field ? ' in ' + edu.field : ''}</span>
            <p style="white-space: pre-wrap;">${edu.description || ''}</p>
            ${dates ? `<span class="date">${dates}</span>` : ''}
          </div>
        </div>
      `);
    });
  } else {
    $('#navi a[href="#page-1"]').parent().remove();
  }

  // Experience
  const expContainer = $('#page-2');
  expContainer.empty();
  if (data.experience && data.experience.length > 0) {
    expContainer.append('<h2 class="heading">Experience</h2>');
    data.experience.forEach(exp => {
      const dates = exp.dates || (exp.startDate ? `${exp.startDate} - ${exp.endDate || 'Present'}` : '');
      expContainer.append(`
        <div class="resume-wrap d-flex ftco-animate fadeInUp ftco-animated">
          <div class="icon d-flex align-items-center justify-content-center">
            <span class="flaticon-suitcase"></span>
          </div>
          <div class="text pl-3">
            <h2>${exp.role}</h2>
            <span class="position">${exp.company} ${exp.location ? '- ' + exp.location : ''}</span>
            <p class="date">${dates}</p>
            <p style="white-space: pre-wrap;">${exp.description || ''}</p>
          </div>
        </div>
      `);
    });
  } else {
    $('#navi a[href="#page-2"]').parent().remove();
  }

  // Skills
  const skillsContainer = $('#page-3');
  skillsContainer.empty();
  if (data.skills && data.skills.length > 0) {
    skillsContainer.append('<h2 class="heading">Skills & Technologies</h2>');
    let currentRow = $('<div class="row mb-4 ftco-animate fadeInUp ftco-animated"></div>');
    data.skills.forEach((skill, idx) => {
      if (idx % 6 === 0 && idx !== 0) {
        skillsContainer.append(currentRow);
        currentRow = $('<div class="row mb-4 ftco-animate fadeInUp ftco-animated"></div>');
      }
      currentRow.append(`
        <div class="col">
          <div class="text-center p-3 shadow-sm rounded bg-light font-weight-bold" style="height: 100%; display: flex; align-items: center; justify-content: center; color: black; border-bottom: 3px solid #3e64ff;">
            ${skill.name}
          </div>
        </div>
      `);
    });
    skillsContainer.append(currentRow);
  } else {
    $('#navi a[href="#page-3"]').parent().remove();
  }

  // Projects
  const projSection = $('#project-section');
  if (data.projects && data.projects.length > 0) {
    const projContainer = $('#project-section .container-fluid');
    $('#project-section .row').slice(1).remove(); // Keep header
    
    let currentRow = $('<div class="row"></div>');
    data.projects.forEach((proj, idx) => {
      if (idx % 3 === 0 && idx !== 0) {
        projContainer.append(currentRow);
        currentRow = $('<div class="row"></div>');
      }
      currentRow.append(`
        <div class="col-md-4 text-center d-flex mx-auto ftco-animate fadeInUp ftco-animated">
          <a href="${proj.url || proj.github || '#'}" target="_blank" class="services-1 shadow w-100" style="display:block; text-decoration:none; text-align:left; padding:2rem;">
            <div class="desc">
              <h3 class="mb-3" style="color:black;">${proj.name}</h3>
              <p style="color:#3e64ff; font-weight:bold;">${proj.technologies}</p>
              <p style="color:#666; white-space: pre-wrap;">${proj.description}</p>
            </div>
          </a>
        </div>
      `);
    });
    projContainer.append(currentRow);
  } else {
    projSection.remove();
  }

  // Achievements & Certifications
  const awardsContainer = $('#page-4');
  awardsContainer.empty();
  let hasPage4 = false;
  
  if (data.certifications && data.certifications.length > 0) {
    awardsContainer.append('<h2 class="heading">Certifications</h2>');
    data.certifications.forEach(cert => {
       awardsContainer.append(`
        <div class="resume-wrap d-flex ftco-animate fadeInUp ftco-animated">
          <div class="icon d-flex align-items-center justify-content-center">
            <span class="flaticon-medal"></span>
          </div>
          <div class="text pl-3">
            <h2>${cert.name}</h2>
            <span class="position">${cert.issuer} ${cert.date ? ' - ' + cert.date : ''}</span>
            ${cert.url ? `<p><a href="${cert.url}" target="_blank" style="color:#3e64ff;">View Credential</a></p>` : ''}
          </div>
        </div>
      `);
    });
    hasPage4 = true;
  }
  
  if (data.achievements && data.achievements.length > 0) {
    awardsContainer.append('<h2 class="heading">Achievements</h2>');
    data.achievements.forEach(ach => {
       awardsContainer.append(`
        <div class="resume-wrap d-flex ftco-animate fadeInUp ftco-animated">
          <div class="icon d-flex align-items-center justify-content-center">
            <span class="flaticon-medal"></span>
          </div>
          <div class="text pl-3">
            <h2>${ach.title}</h2>
            <p style="white-space: pre-wrap;">${ach.description || ''}</p>
          </div>
        </div>
      `);
    });
    hasPage4 = true;
  }

  if (!hasPage4) {
    $('#navi a[href="#page-4"]').parent().remove();
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    const langPage = $('<div id="page-5" class="page"></div>');
    langPage.append('<h2 class="heading">Languages</h2>');
    data.languages.forEach(lang => {
       langPage.append(`
        <div class="resume-wrap d-flex ftco-animate fadeInUp ftco-animated">
          <div class="icon d-flex align-items-center justify-content-center" style="background: #3e64ff; color: white;">
            <span>🌐</span>
          </div>
          <div class="text pl-3">
            <h2>${lang.name}</h2>
            <p>${lang.proficiency || ''}</p>
          </div>
        </div>
      `);
    });
    $('#page-4').after(langPage);
    $('#navi ul').append('<li><a href="#page-5">Languages</a></li>');
  }

  return $.html();
}
