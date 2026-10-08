export function notFound(req, res, next) {
    res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
    console.error(err);

    const status = err.status || 500
    const message = process.env.NODE_ENV === 'production' && status === 500 ? 'Something went wrong' : err.message;


    res.status(status).json({ error: message })

}