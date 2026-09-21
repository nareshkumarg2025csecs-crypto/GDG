const CertificateService = require('../src/services/certificateService');

describe('Certificate Generation Service Tests', () => {
  test('listAssets returns default pre-loaded GDG assets', () => {
    const assets = CertificateService.listAssets();
    expect(Array.isArray(assets)).toBe(true);
    const filenames = assets.map((a) => a.filename);
    expect(filenames).toContain('gdg_logo.png');
    expect(filenames).toContain('gold_seal.png');
    expect(filenames).toContain('certificate_bg.png');
  });

  test('CertificateService exposes DEFAULT_PYTHON_TEMPLATE', () => {
    expect(CertificateService.DEFAULT_PYTHON_TEMPLATE).toBeDefined();
    expect(CertificateService.DEFAULT_PYTHON_TEMPLATE).toContain('GDG Certificate Generator');
    expect(CertificateService.DEFAULT_PYTHON_TEMPLATE).toContain('CERTIFICATE OF PARTICIPATION');
  });

  test('CertificateService exposes default email subject and body helpers', () => {
    const subject = CertificateService.getDefaultEmailSubject('Flutter Bootcamp');
    expect(subject).toBe('Your Certificate of Participation: Flutter Bootcamp');

    const body = CertificateService.getDefaultEmailBody('Flutter Bootcamp');
    expect(body).toContain('{attendee_name}');
    expect(body).toContain('Flutter Bootcamp');
    expect(body).toContain('Google Developer Groups (GDG)');
  });

  test('CertificateService.getSubmissionEmail prioritizes form answers over profile email', () => {
    const answers = {
      email: 'student.personal@gmail.com',
      full_name: 'Valt Aoi',
    };
    const profileEmail = 'valt@college.edu';
    const profileName = 'Profile Valt';

    const email = CertificateService.getSubmissionEmail(answers, profileEmail);
    const name = CertificateService.getSubmissionName(answers, profileName);

    expect(email).toBe('student.personal@gmail.com');
    expect(name).toBe('Valt Aoi');
  });

  test('CertificateService.getSubmissionEmail falls back to profile email when form email is missing', () => {
    const answers = {};
    const profileEmail = 'fallback@college.edu';
    const profileName = 'Fallback Name';

    const email = CertificateService.getSubmissionEmail(answers, profileEmail);
    const name = CertificateService.getSubmissionName(answers, profileName);

    expect(email).toBe('fallback@college.edu');
    expect(name).toBe('Fallback Name');
  });

  test('runPythonGenerator successfully compiles and renders PNG certificate', async () => {
    const mockData = {
      attendee_name: 'Harini Sundar',
      attendee_email: 'harini@example.com',
      event_title: 'Google Cloud Study Jam',
      event_date: 'October 15, 2026',
      ticket_id: 'GDG-TEST-4421',
      certificate_id: 'CERT-GDG-TEST-001',
      answers: {
        college_name: 'Rajalakshmi Engineering College',
        department: 'Information Technology',
      },
    };

    const result = await CertificateService.runPythonGenerator({
      scriptCode: null, // use default template
      data: mockData,
      outputFormat: 'png',
    });

    expect(result).toBeDefined();
    expect(result.format).toBe('png');
    expect(result.mimeType).toBe('image/png');
    expect(result.filename).toContain('Harini_Sundar.png');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(10000); // Verify non-empty image file
  });

  test('runPythonGenerator successfully compiles and renders PDF certificate', async () => {
    const mockData = {
      attendee_name: 'Karthik Raja',
      attendee_email: 'karthik@example.com',
      event_title: 'Flutter Forward Hackathon',
      event_date: 'November 20, 2026',
      ticket_id: 'GDG-TEST-9921',
      certificate_id: 'CERT-GDG-TEST-002',
      answers: {},
    };

    const result = await CertificateService.runPythonGenerator({
      scriptCode: null,
      data: mockData,
      outputFormat: 'pdf',
    });

    expect(result).toBeDefined();
    expect(result.format).toBe('pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.filename).toContain('Karthik_Raja.pdf');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(10000);
  });
});
