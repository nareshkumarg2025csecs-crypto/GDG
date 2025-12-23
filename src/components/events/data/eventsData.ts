// Event data and types for the Events experience

export interface EventItem {
    id: number
    title: string
    type: 'Conference' | 'Workshop' | 'Study Jam' | 'Summit' | 'Hackathon' | 'Panel' | 'Watch Party'
    date: string
    description: string
    color: string
}

// Google colors for theming
export const GOOGLE_COLORS = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC04',
    green: '#34A853',
}

// Event data for the academic year
export const eventsData: EventItem[] = [
    {
        id: 1,
        title: 'DevFest 2025',
        type: 'Conference',
        date: 'Jan 15',
        color: GOOGLE_COLORS.blue,
        description: 'Annual flagship developer conference with keynotes, workshops, and networking.',
    },
    {
        id: 2,
        title: 'Flutter Workshop',
        type: 'Workshop',
        date: 'Jan 28',
        color: GOOGLE_COLORS.green,
        description: 'Hands-on session to build your first cross-platform Flutter application.',
    },
    {
        id: 3,
        title: 'AI ML Study Jam',
        type: 'Study Jam',
        date: 'Feb 10',
        color: GOOGLE_COLORS.red,
        description: 'Collaborative learning session on TensorFlow and machine learning basics.',
    },
    {
        id: 4,
        title: 'Cloud Summit',
        type: 'Summit',
        date: 'Feb 25',
        color: GOOGLE_COLORS.yellow,
        description: 'Deep dive into Google Cloud Platform services and best practices.',
    },
    {
        id: 5,
        title: 'Hackathon 2025',
        type: 'Hackathon',
        date: 'Mar 8-9',
        color: GOOGLE_COLORS.blue,
        description: '48-hour coding marathon to build innovative solutions.',
    },
    {
        id: 6,
        title: 'Firebase Workshop',
        type: 'Workshop',
        date: 'Mar 22',
        color: GOOGLE_COLORS.red,
        description: 'Learn backend-as-a-service with Firebase for web and mobile apps.',
    },
    {
        id: 7,
        title: 'Women Techmakers',
        type: 'Panel',
        date: 'Apr 5',
        color: GOOGLE_COLORS.yellow,
        description: 'Panel discussion celebrating women in technology.',
    },
    {
        id: 8,
        title: 'I/O Extended',
        type: 'Watch Party',
        date: 'May 14',
        color: GOOGLE_COLORS.green,
        description: 'Live watch party for Google I/O with local networking.',
    },
]
