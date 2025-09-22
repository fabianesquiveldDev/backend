import cors from 'cors'

const ACCEPTED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:1234',
    'https://movies.com',
    'https://midu.dev',
    'https://app-admin-medicitas-lqciustkl-fabians-projects-e8fa0f2d.vercel.app',
    'https://medicitas.site'
]

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => {
    const corsOptions = cors({
        origin: (origin, callback) => {
            if (!origin || acceptedOrigins.includes(origin)) {
                return callback(null, true)
            }
            return callback(new Error('Not allowed by CORS'))
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    })

    return (req, res, next) => {
        if (req.method === 'OPTIONS') {
            corsOptions(req, res, next) // manejar preflight
        } else {
            corsOptions(req, res, next)
        }
    }
}
