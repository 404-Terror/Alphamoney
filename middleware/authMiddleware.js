const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        // User is authenticated, proceed to the next middleware
        next();
    } else {
        // User is not authenticated, send an unauthorized response
        res.redirect('/');
    }
};

export default isAuthenticated;


