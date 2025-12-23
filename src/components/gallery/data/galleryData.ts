export type GalleryCategory = 'Workshops' | 'Hackathons' | 'Tech Talks' | 'Community';

export interface GalleryStory {
    intro: string;
    narrative: string;
    impact: string;
    quote?: {
        text: string;
        author: string;
        role: string;
    };
}

export interface GalleryParticipant {
    name: string;
    role: string;
    photo?: string;
}

export interface GalleryMetrics {
    attendees?: number;
    duration?: string;
    projects?: number;
    satisfaction?: string;
}

export interface GalleryItem {
    id: number;
    title: string;
    category: GalleryCategory;
    date: string;

    // Visual Variants
    image: string;
    artifactImage: string;
    realImage: string;
    backgroundColor?: string;

    // Story Data
    story: GalleryStory;
    participants: GalleryParticipant[];
    metrics: GalleryMetrics;
    gallery: string[];

    // Display Options
    featured: boolean;
    splatUrl?: string;
    fallbackImage: string;
    priority?: number;
    description?: string;
}

export const GALLERY_CATEGORIES: GalleryCategory[] = [
    'Workshops',
    'Hackathons',
    'Tech Talks',
    'Community',
];

export const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: 1,
        title: 'Cloud Summit Keynote',
        category: 'Tech Talks',
        date: 'Oct 2024',
        image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#1a1f35',
        featured: true,
        priority: 1,
        story: {
            intro: "A groundbreaking deep-dive into Google Cloud's latest AI/ML capabilities and serverless architectures.",
            narrative: "Over 200 developers gathered as industry experts unveiled Google Cloud's next-generation AI tools. The keynote featured live demonstrations of Vertex AI's new auto-scaling capabilities and real-time code generation using Gemini Pro.\n\nAttendees participated in hands-on sessions, deploying containerized applications to Cloud Run and experimenting with BigQuery ML for predictive analytics. The energy in the room was electric as teams competed to build the fastest serverless API.\n\nThe event sparked collaborations that extended far beyond the conference hall, with several attendees forming study groups to pursue Google Cloud certifications together.",
            impact: "Launched 8 new cloud-native projects in the community and certified 15 developers in Google Cloud Platform within 3 months.",
            quote: {
                text: "This wasn't just a talk—it was a launchpad. We left with the tools and confidence to build production-grade cloud solutions.",
                author: "Priya Sharma",
                role: "Lead Developer, TechCorp"
            }
        },
        participants: [
            { name: "Dr. Arjun Mehta", role: "Cloud Architect, Google" },
            { name: "Sarah Chen", role: "ML Engineer" },
            { name: "Vikram Patel", role: "Community Organizer" }
        ],
        metrics: {
            attendees: 210,
            duration: "6 hours",
            projects: 8,
            satisfaction: "4.9/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 2,
        title: 'AI Hackathon Finals',
        category: 'Hackathons',
        date: 'Nov 2024',
        image: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#2d1b3d',
        featured: true,
        priority: 2,
        story: {
            intro: "48 hours of pure innovation: Teams raced to build AI solutions that could change lives.",
            narrative: "The energy was palpable as 15 teams transformed caffeine into code, building AI-powered solutions for real-world problems. From healthcare diagnostics to sustainable agriculture, the creativity was boundless.\n\nThe winning team created an AI assistant for visually impaired students, using Google's Gemini API to describe lecture slides in real-time. Their pitch brought tears to the judges' eyes and a standing ovation from the crowd.\n\nWhat started as a competition became a movement, with teams continuing to develop their projects long after the final presentations.",
            impact: "3 projects secured startup funding, 1 won a national innovation award, and 12 participants joined tech companies within 2 months.",
            quote: {
                text: "We came to compete. We left as founders. This hackathon changed the trajectory of our careers.",
                author: "Team CodeCrafters",
                role: "Winning Team"
            }
        },
        participants: [
            { name: "Neha Gupta", role: "Hackathon Lead" },
            { name: "Rohan Kumar", role: "Mentor, AI/ML" },
            { name: "Lisa Wang", role: "Judge, VC Partner" }
        ],
        metrics: {
            attendees: 75,
            duration: "48 hours",
            projects: 15,
            satisfaction: "5.0/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 3,
        title: 'Flutter Workshop',
        category: 'Workshops',
        date: 'Sep 2024',
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#1e3a5f',
        featured: true,
        story: {
            intro: "From zero to deployed: Building beautiful cross-platform apps in a single day.",
            narrative: "Beginners and veterans alike dove into Flutter's reactive framework, building a full e-commerce app from scratch. The workshop started with UI fundamentals and progressed to state management, API integration, and deployment.\n\nBy lunchtime, participants had running apps on both Android and iOS. By evening, they were implementing Firebase authentication and real-time updates. The 'aha!' moments were visible on every face.\n\nThe collaborative atmosphere turned strangers into study partners, with several forming ongoing dev groups to continue learning together.",
            impact: "85% of attendees shipped their first Flutter app within 2 weeks. 6 apps reached the Play Store within a month.",
            quote: {
                text: "I've been putting off mobile development for years. This workshop made it click. I shipped my app idea in 10 days.",
                author: "Amit Desai",
                role: "Web Developer turned Mobile Dev"
            }
        },
        participants: [
            { name: "Kavya Nair", role: "Flutter GDE" },
            { name: "Rahul Singh", role: "Senior Developer" },
            { name: "Emily Zhang", role: "UX Designer" }
        ],
        metrics: {
            attendees: 120,
            duration: "8 hours",
            projects: 6,
            satisfaction: "4.8/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 4,
        title: 'Community Mixer',
        category: 'Community',
        date: 'Dec 2024',
        image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#2a3f2f',
        featured: true,
        story: {
            intro: "An evening of connection, collaboration, and celebration of our growing tech community.",
            narrative: "Developers, designers, and dreamers gathered for an unforgettable night of networking and knowledge sharing. Lightning talks showcased side projects, from indie games to social impact apps.\n\nThe highlight was the 'Random Coffee' matching system that paired strangers based on interests, sparking unexpected collaborations. By the end of the night, three new projects had formed, and the Slack channel was buzzing with ideas.\n\nFood, music, and genuine conversation created an atmosphere where introverts became extroverts and everyone left feeling part of something bigger.",
            impact: "Formed 5 study groups, 2 open-source projects launched, and 40+ new friendships created.",
            quote: {
                text: "I came alone and nervous. I left with a co-founder, three mentors, and a renewed passion for tech.",
                author: "Maya Krishnan",
                role: "Junior Developer"
            }
        },
        participants: [
            { name: "Carlos Rodriguez", role: "Event Host" },
            { name: "Zara Ali", role: "Lightning Talk Curator" },
            { name: "James Thompson", role: "DJ & Developer" }
        ],
        metrics: {
            attendees: 95,
            duration: "4 hours",
            projects: 2,
            satisfaction: "4.9/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1514525253440-b393452e23f9?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 5,
        title: 'Web Dev Bootcamp',
        category: 'Workshops',
        date: 'Aug 2024',
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#3d2a1b',
        featured: false,
        story: {
            intro: "Intensive 3-day immersion into modern web development with React, Next.js, and Tailwind CSS.",
            narrative: "From HTML fundamentals to deploying production apps, this bootcamp compressed months of learning into 72 intensive hours. Participants built personal portfolios, blog platforms, and e-commerce sites.\n\nThe teaching approach was hands-on: no slides, just live coding and debugging together. When errors appeared, the entire class problem-solved as a unit, creating a collaborative rather than competitive atmosphere.\n\nMany attendees were career switchers—teachers, designers, marketers—all hungry to break into tech. By day three, they were deploying full-stack applications and updating their LinkedIn profiles.",
            impact: "70% of participants landed dev roles or freelance clients within 4 months. 3 started dev agencies.",
            quote: {
                text: "I went from 'what is a div?' to deploying my first SaaS product in 6 weeks. This bootcamp was the catalyst.",
                author: "Lila Patel",
                role: "Former Teacher, Now Fullstack Developer"
            }
        },
        participants: [
            { name: "Alex Kim", role: "Lead Instructor" },
            { name: "Jordan Lee", role: "TA, Frontend Specialist" },
            { name: "Taylor Brooks", role: "TA, Backend Expert" }
        ],
        metrics: {
            attendees: 45,
            duration: "3 days",
            projects: 45,
            satisfaction: "4.7/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 6,
        title: 'Gen AI Panel',
        category: 'Tech Talks',
        date: 'Nov 2024',
        image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#1f2d3d',
        featured: true,
        story: {
            intro: "Industry leaders debated the future of AI: ethics, opportunities, and the road ahead.",
            narrative: "The panel brought together researchers, entrepreneurs, and ethicists for a frank discussion on generative AI's impact. Topics ranged from job displacement fears to creative empowerment and the need for responsible development.\n\nThe Q&A session was electric, with attendees challenging panelists on bias in AI models and the environmental cost of training LLMs. No topic was off-limits, and the honesty was refreshing.\n\nThe event didn't provide easy answers, but it equipped attendees with frameworks for thinking critically about AI's role in society.",
            impact: "Sparked 3 research collaborations and inspired 10+ developers to contribute to AI ethics initiatives.",
            quote: {
                text: "This wasn't AI hype—it was AI reality. We left with more questions than answers, and that's exactly what we needed.",
                author: "Dr. Samuel Okafor",
                role: "AI Researcher"
            }
        },
        participants: [
            { name: "Dr. Anita Rao", role: "AI Ethics Lead, Google" },
            { name: "Michael Chang", role: "Founder, AI Startup" },
            { name: "Sofia Martinez", role: "Policy Researcher" }
        ],
        metrics: {
            attendees: 180,
            duration: "2.5 hours",
            satisfaction: "4.8/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1504384308090-c54be3855833?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 7,
        title: 'Design Sprint',
        category: 'Workshops',
        date: 'Oct 2024',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#3a2d1f',
        featured: false,
        story: {
            intro: "5 days to solve hard problems: UX design sprints that turn ideas into tested prototypes.",
            narrative: "Teams tackled real business challenges using Google's Design Sprint methodology. Day 1: Define the problem. Day 2: Sketch solutions. Day 3: Decide on the best approach. Day 4: Build a realistic prototype. Day 5: Test with real users.\n\nThe intensity was unmatched. Teams worked late into the night, fueled by pizza and passion. By Friday, they had clickable prototypes and insights from 15+ user interviews.\n\nOne team's solution for small business inventory management was so compelling that they launched a startup immediately after the sprint.",
            impact: "4 teams pivoted their products based on insights. 1 startup founded, 2 features shipped to production.",
            quote: {
                text: "We spent 6 months building the wrong thing. This sprint saved us from another year of wasted effort.",
                author: "Team PixelPerfect",
                role: "Startup Founders"
            }
        },
        participants: [
            { name: "Hannah Park", role: "UX Lead, Google" },
            { name: "Oliver Smith", role: "Product Designer" },
            { name: "Nina Patel", role: "User Researcher" }
        ],
        metrics: {
            attendees: 30,
            duration: "5 days",
            projects: 6,
            satisfaction: "4.9/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 8,
        title: 'DevFest Afterparty',
        category: 'Community',
        date: 'Oct 2024',
        image: 'https://images.unsplash.com/photo-1514525253440-b393452e23f9?q=80&w=1000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1514525253440-b393452e23f9?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1514525253440-b393452e23f9?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#2d1a3f',
        featured: true,
        story: {
            intro: "The perfect ending to an epic DevFest: music, memories, and new beginnings.",
            narrative: "After two days of intensive talks and workshops, the community came together to celebrate. Live DJ sets mixed with impromptu karaoke sessions, and the dance floor was packed till midnight.\n\nThe highlight was the 'Swag Raffle'—limited edition tees, Pixel phones, and Cloud credits were given away, with cheers erupting with each announcement. But the real prize was the connections formed.\n\nStrangers became collaborators, junior devs found mentors, and everyone left buzzing with energy and ideas for the year ahead.",
            impact: "Solidified community bonds. 15+ collaborations started, countless memories created.",
            quote: {
                text: "DevFest gives me skills. The afterparty gives me friends. Together, they're magic.",
                author: "Community Member",
                role: "Developer & Dancer"
            }
        },
        participants: [
            { name: "DJ CodeBeat", role: "Music & Vibes" },
            { name: "Event Team", role: "Organizers Extraordinaire" }
        ],
        metrics: {
            attendees: 250,
            duration: "5 hours",
            satisfaction: "5.0/5"
        },
        gallery: [
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1514525253440-b393452e23f9?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 9,
        title: 'Design Systems 2.0',
        category: 'Workshops',
        date: 'Jan 2025',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#1E1E1E',
        featured: true,
        priority: 1,
        story: {
            intro: "A deep dive into the future of spatial design and 3D interfaces.",
            narrative: "This exclusive workshop explored the boundaries of web design, moving beyond flat interfaces into immersive 3D experiences. Participants learned to build 'Memory Palaces' using WebGL and advanced layout techniques.\n\nThe user's own design references served as the primary inspiration, leading to a collection of scattered, gravity-defying layouts that challenge the status quo.\n\nBy the end of the session, each designer had prototyped a unique portfolio piece that felt less like a website and more like a digital world.",
            impact: "Redefined the visual language of our community projects.",
            quote: {
                text: "We stopped designing pages and started building worlds.",
                author: "Lead Designer",
                role: "Creative Director"
            }
        },
        participants: [
            { name: "Alex Chen", role: "3D Artist" },
            { name: "Sarah Jones", role: "Frontend Dev" }
        ],
        metrics: {
            attendees: 40,
            duration: "3 days",
            projects: 12,
            satisfaction: "5.0/5"
        },
        gallery: [
            '/images/upload_1.png',
            '/images/upload_2.png',
            '/images/upload_3.png'
        ]
    },
    {
        id: 10,
        title: 'Archive Exhibition',
        category: 'Community',
        date: 'Feb 2025',
        image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=2000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1523365237953-0eda1df49340?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#2A2A2A',
        featured: true,
        story: {
            intro: "Curating the digital history of our developer group.",
            narrative: "An immersive exhibition showcasing the best projects from the past year. We printed physical polaroids of digital work and scattered them across a 'Memory Desk', bridging the physical and digital worlds.\n\nVisitors could pick up items, scan them, and see the code behind the magic. It was a celebration of tangible computing in an increasingly ephemeral web.\n\nThe 'Marius Ballot' style cards were a hit, offering a sleek, tilted perspective on our collective achievements.",
            impact: "Documented 50+ projects in a permanent digital archive.",
            quote: {
                text: "History isn't just text; it's the code we wrote and the designs we shipped.",
                author: "Archivist",
                role: "Community Lead"
            }
        },
        participants: [],
        metrics: {
            attendees: 150,
            duration: "1 week",
            satisfaction: "4.9/5"
        },
        gallery: ['/images/upload_0.png']
    },
    {
        id: 11,
        title: 'Visual Experiments',
        category: 'Tech Talks',
        date: 'Mar 2025',
        image: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#333333',
        featured: true,
        story: {
            intro: "Pushing pixels to their absolute limit.",
            narrative: "A showcase of experimental rendering techniques, inspired by high-performance racing interfaces. We analyzed how data density can be beautiful, taking cues from telemetry dashboards and Formula 1 aesthetics.\n\nThe result was a new design system that balances technical depth with visual elegance, much like a well-tuned engine.",
            impact: "Created a new high-performance UI kit.",
            quote: {
                text: "Speed is a feature. Beauty is a requirement.",
                author: "Tech Lead",
                role: "Performance Engineer"
            }
        },
        participants: [],
        metrics: {
            attendees: 80,
            duration: "2 hours",
            satisfaction: "4.8/5"
        },
        gallery: ['/images/upload_3.png']
    },
    {
        id: 12,
        title: 'Creative Coding Jam',
        category: 'Hackathons',
        date: 'Apr 2025',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop',
        artifactImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
        realImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop',
        backgroundColor: '#111111',
        featured: true,
        story: {
            intro: "Art meets algorithms in a weekend of generative design.",
            narrative: "Participants used noise algorithms and physics engines to create living, breathing artwork. The 'Scatter' effect seen in our gallery was born here, prototyped by a team obsessed with organic randomness.\n\nWe explored how chaos can be controlled to create unique, non-repeating layouts that feel human despite being machine-generated.",
            impact: "Open-sourced 3 new generative art libraries.",
            quote: {
                text: "Code is the paintbrush of the 21st century.",
                author: "Creative Coder",
                role: "Artist"
            }
        },
        participants: [],
        metrics: {
            attendees: 60,
            duration: "24 hours",
            projects: 20,
            satisfaction: "5.0/5"
        },
        gallery: ['/images/upload_0.png']
    }
];
