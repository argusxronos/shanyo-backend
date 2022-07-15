const { expressjwt: expressJwt } = require('express-jwt'); 

function authJwt() {
    const secretWord = process.env.secretJwtWord;
    const api = process.env.API_URL;

    return expressJwt({
        secret: secretWord,
        algorithms: ['HS256'],
        isRevoked: isRevoked,
        // credentialsRequired: false, ???
        // function (req, res) {
        //     if (!req.isAdmin) return res.sendStatus(401);
        //     res.sendStatus(200);
        //   }
    }).unless({
        path: [
            {url: /\/public\/uploads(.*)/, method: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/products(.*)/, method: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/categories(.*)/, method: ['GET', 'OPTIONS'] },
            `${api}/users/login`,
            `${api}/users/register`,
        ]
    })
}

async function isRevoked(req, token){
    if (!token.payload.isAdmin) {
        return true;
    }
    return false;
}

module.exports = authJwt;